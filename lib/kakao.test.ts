import { createCipheriv, createHash, randomBytes } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"

const dbMock = vi.hoisted(() => ({ select: vi.fn(), insert: vi.fn(), delete: vi.fn() }))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/db/schema", () => ({ kakaoConnections: { id: "id" }, kakaoOAuthStates: { stateHash: "stateHash", expiresAt: "expiresAt", returnToOrigin: "returnToOrigin" } }))
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...conditions) => ({ type: "and", conditions })),
  eq: vi.fn((...args) => ({ type: "eq", args })),
  gt: vi.fn((...args) => ({ type: "gt", args })),
  lt: vi.fn((...args) => ({ type: "lt", args })),
}))

import { consumeKakaoOAuthState, createBookingNotificationText, createKakaoAuthorizationUrl, createKakaoOAuthState, getKakaoIdentity, sendKakaoMemo } from "./kakao"

const TEST_ENCRYPTION_SECRET = "test-encryption-key-longer-than-thirty-two-characters"

function configureKakaoEnvironment() {
  vi.stubEnv("KAKAO_REST_API_KEY", "test-rest-api-key")
  vi.stubEnv("KAKAO_CLIENT_SECRET", "test-client-secret")
  vi.stubEnv("KAKAO_REDIRECT_URI", "https://lotuswellness.test/api/kakao/callback")
  vi.stubEnv("KAKAO_TOKEN_ENCRYPTION_KEY", TEST_ENCRYPTION_SECRET)
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lotuswellness.test")
}

function encryptTokenForTest(token: string): string {
  const key = createHash("sha256").update(TEST_ENCRYPTION_SECRET).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".")
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  dbMock.select.mockReset()
  dbMock.insert.mockReset()
  dbMock.delete.mockReset()
})

describe("Kakao admin authorization", () => {
  it("requests only the talk_message scope and uses the configured callback", () => {
    configureKakaoEnvironment()

    const authorizationUrl = new URL(createKakaoAuthorizationUrl("test-state"))

    expect(authorizationUrl.searchParams.get("scope")).toBe("talk_message")
    expect(authorizationUrl.searchParams.get("redirect_uri")).toBe("https://lotuswellness.test/api/kakao/callback")
    expect(authorizationUrl.searchParams.get("state")).toBe("test-state")
  })

  it("stores only a hash of a short-lived OAuth state and its safe return origin", async () => {
    configureKakaoEnvironment()
    const values = vi.fn().mockResolvedValue(undefined)
    const cleanup = vi.fn().mockResolvedValue([])
    dbMock.delete.mockReturnValue({ where: cleanup })
    dbMock.insert.mockReturnValue({ values })

    await createKakaoOAuthState("one-time-state", "https://lotuswellness.test")

    const stored = values.mock.calls[0][0] as { stateHash: string; returnToOrigin: string; expiresAt: Date }
    expect(stored.stateHash).not.toBe("one-time-state")
    expect(stored.stateHash).toMatch(/^[a-f0-9]{64}$/)
    expect(stored.returnToOrigin).toBe("https://lotuswellness.test")
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(stored.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000)
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it("consumes a matching OAuth state once and returns its originating host", async () => {
    const returning = vi.fn()
      .mockResolvedValueOnce([{ returnToOrigin: "https://preview.lotuswellness.test" }])
      .mockResolvedValueOnce([])
    const where = vi.fn().mockReturnValue({ returning })
    dbMock.delete.mockReturnValue({ where })

    await expect(consumeKakaoOAuthState("one-time-state")).resolves.toEqual({
      returnToOrigin: "https://preview.lotuswellness.test",
    })
    await expect(consumeKakaoOAuthState("one-time-state")).resolves.toBeNull()
    expect(where).toHaveBeenCalledTimes(2)
    expect(returning).toHaveBeenCalledTimes(2)
  })

  it("checks only talk_message and reads only the Kakao account ID", async () => {
    const fetchMock = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        scopes: [{ id: "talk_message", agreed: true }],
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 12345 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
    vi.stubGlobal("fetch", fetchMock)

    const identity = await getKakaoIdentity("test-access-token")

    const scopesUrl = new URL(String(fetchMock.mock.calls[0][0]))
    expect(scopesUrl.searchParams.get("scopes")).toBe("talk_message")
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://kapi.kakao.com/v2/user/me")
    expect(identity).toEqual({ userId: "12345", scopes: ["talk_message"] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe("Kakao notifications", () => {
  it("formats booking details within Kakao's text limit", () => {
    const message = createBookingNotificationText({
      reference: "58241",
      customerName: "Test Customer",
      phone: "0900000000",
      serviceName: "Traditional Massage",
      durationMinutes: 60,
      date: "2026-11-25",
      time: "10:00",
      guests: 2,
    })

    expect(message).toContain("Ref: 58241")
    expect(message).toContain("Traditional Massage")
    expect(message).toContain("2026-11-25 10:00")
    expect(Array.from(message).length).toBeLessThanOrEqual(200)
  })

  it("posts a default text memo to the admin account's My Chatroom", async () => {
    configureKakaoEnvironment()
    const accessToken = "server-side-access-token"
    const connection = {
      status: "connected",
      accessTokenEncrypted: encryptTokenForTest(accessToken),
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }
    dbMock.select.mockReturnValue({
      from: () => ({
        where: () => ({ limit: async () => [connection] }),
      }),
    })

    const fetchMock = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(new Response(JSON.stringify({ result_code: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }))
    vi.stubGlobal("fetch", fetchMock)

    await sendKakaoMemo("New customer question")

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://kapi.kakao.com/v2/api/talk/memo/default/send")
    const request = fetchMock.mock.calls[0][1]
    expect(request?.method).toBe("POST")
    expect(new Headers(request?.headers).get("authorization")).toBe(`Bearer ${accessToken}`)
    const body = new URLSearchParams(String(request?.body))
    const template = JSON.parse(body.get("template_object") ?? "{}") as { object_type: string; text: string; link: { web_url: string } }
    expect(template.object_type).toBe("text")
    expect(template.text).toBe("New customer question")
    expect(template.link.web_url).toBe("https://lotuswellness.test/admin")
  })
})
