import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/lib/db/schema", () => ({ kakaoConnections: {} }))

import { getKakaoIdentity } from "./kakao"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("Kakao identity verification", () => {
  it("requests consent details with the comma-separated scope format required by Kakao", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        scopes: [
          { id: "talk_message", agreed: true },
          { id: "phone_number", agreed: true },
          { id: "profile_nickname", agreed: true },
        ],
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 12345,
        kakao_account: {
          profile: { nickname: "LOTUS WELLNESS" },
          phone_number: "+82 10-2645-1934",
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
    vi.stubGlobal("fetch", fetch)

    const identity = await getKakaoIdentity("test-access-token")

    const scopesUrl = new URL(String(fetch.mock.calls[0][0]))
    expect(scopesUrl.searchParams.get("scopes")).toBe("talk_message,phone_number,profile_nickname")
    expect(identity).toEqual({
      userId: "12345",
      nickname: "LOTUS WELLNESS",
      phoneNumber: "+82 10-2645-1934",
      scopes: ["talk_message", "phone_number", "profile_nickname"],
    })
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
