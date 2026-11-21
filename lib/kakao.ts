import "server-only"
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { and, eq, gt, lt } from "drizzle-orm"
import { db } from "@/lib/db"
import { kakaoConnections, kakaoOAuthStates } from "@/lib/db/schema"

export const LOTUS_ADMIN = {
  email: "saigonservice2020@gmail.com",
} as const

const REQUIRED_SCOPES = ["talk_message"] as const
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"

export type KakaoTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  refresh_token_expires_in?: number
  scope?: string
}

export class KakaoDeliveryError extends Error {
  constructor(message: string, readonly safeToRetry: boolean) {
    super(message)
    this.name = "KakaoDeliveryError"
  }
}

export function getKakaoConfiguration() {
  const clientId = process.env.KAKAO_REST_API_KEY
  const redirectUri = process.env.KAKAO_REDIRECT_URI
  const encryptionSecret = process.env.KAKAO_TOKEN_ENCRYPTION_KEY
  const clientSecret = process.env.KAKAO_CLIENT_SECRET

  if (!clientId || !clientSecret || !redirectUri || !encryptionSecret || encryptionSecret.length < 32) return null
  return { clientId, clientSecret, redirectUri, encryptionSecret }
}

export function createKakaoAuthorizationUrl(state: string): string {
  const config = getKakaoConfiguration()
  if (!config) throw new Error("Kakao OAuth configuration is incomplete")

  const url = new URL("https://kauth.kakao.com/oauth/authorize")
  url.searchParams.set("client_id", config.clientId)
  url.searchParams.set("redirect_uri", config.redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", REQUIRED_SCOPES.join(","))
  url.searchParams.set("state", state)
  return url.toString()
}

async function readJsonResponse<T>(response: Response, label: string): Promise<T> {
  const body = await response.json().catch(() => null)
  if (!response.ok || !body || typeof body !== "object") {
    throw new Error(`${label} failed (${response.status})`)
  }
  return body as T
}

export async function exchangeKakaoAuthorizationCode(code: string): Promise<KakaoTokenResponse> {
  const config = getKakaoConfiguration()
  if (!config) throw new Error("Kakao OAuth configuration is incomplete")

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code,
  })
  if (config.clientSecret) body.set("client_secret", config.clientSecret)

  const response = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
    signal: AbortSignal.timeout(10_000),
  })
  const tokens = await readJsonResponse<KakaoTokenResponse>(response, "Kakao token exchange")
  if (!tokens.access_token || !tokens.refresh_token || !Number.isFinite(tokens.expires_in)) {
    throw new Error("Kakao did not return the required access and refresh tokens")
  }
  return tokens
}

type KakaoScopesResponse = {
  scopes?: Array<{ id?: string; agreed?: boolean; using?: boolean }>
}

type KakaoUserResponse = {
  id?: string | number
}

export async function getKakaoIdentity(accessToken: string) {
  const scopesUrl = new URL("https://kapi.kakao.com/v2/user/scopes")
  scopesUrl.searchParams.set("scopes", REQUIRED_SCOPES.join(","))
  const scopesResponse = await fetch(scopesUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  })
  const scopesData = await readJsonResponse<KakaoScopesResponse>(scopesResponse, "Kakao permission check")
  const grantedScopes = (scopesData.scopes ?? [])
    .filter((scope) => scope.agreed === true || scope.using === true)
    .map((scope) => scope.id)
    .filter((scope): scope is string => Boolean(scope))

  if (!REQUIRED_SCOPES.every((scope) => grantedScopes.includes(scope))) {
    throw new Error("Kakao has not granted the talk_message permission")
  }

  const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  })
  const user = await readJsonResponse<KakaoUserResponse>(userResponse, "Kakao account verification")
  const userId = user.id === undefined ? "" : String(user.id)

  return { userId, scopes: grantedScopes }
}

export async function createKakaoOAuthState(state: string, returnToOrigin: string): Promise<void> {
  if (!state || state.length > 256) throw new Error("Kakao OAuth state is invalid")

  const now = new Date()
  const stateHash = createHash("sha256").update(state, "utf8").digest("hex")
  await db.delete(kakaoOAuthStates).where(lt(kakaoOAuthStates.expiresAt, now))
  await db.insert(kakaoOAuthStates).values({
    stateHash,
    returnToOrigin,
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
  })
}

export async function consumeKakaoOAuthState(state: string): Promise<{ returnToOrigin: string } | null> {
  if (!state || state.length > 256) return null

  const stateHash = createHash("sha256").update(state, "utf8").digest("hex")
  const [consumedState] = await db
    .delete(kakaoOAuthStates)
    .where(and(eq(kakaoOAuthStates.stateHash, stateHash), gt(kakaoOAuthStates.expiresAt, new Date())))
    .returning({ returnToOrigin: kakaoOAuthStates.returnToOrigin })

  return consumedState ?? null
}

function getEncryptionKey(): Buffer {
  const config = getKakaoConfiguration()
  if (!config) throw new Error("Kakao token encryption is not configured")
  return createHash("sha256").update(config.encryptionSecret).digest()
}

function encryptToken(token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".")
}

function decryptToken(value: string): string {
  const [ivPart, tagPart, ciphertextPart] = value.split(".")
  if (!ivPart || !tagPart || !ciphertextPart) throw new Error("Stored Kakao token is invalid")

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivPart, "base64url"))
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"))
  return Buffer.concat([decipher.update(Buffer.from(ciphertextPart, "base64url")), decipher.final()]).toString("utf8")
}

export async function saveVerifiedKakaoConnection(input: {
  userId: string
  scopes: string[]
  tokens: KakaoTokenResponse
}) {
  const verifiedAt = new Date()
  const accessTokenExpiresAt = new Date(Date.now() + input.tokens.expires_in * 1000)
  const refreshTokenExpiresAt = input.tokens.refresh_token_expires_in
    ? new Date(Date.now() + input.tokens.refresh_token_expires_in * 1000)
    : null
  const values = {
    id: 1,
    kakaoUserId: input.userId,
    nickname: "",
    phoneNumber: "",
    accessTokenEncrypted: encryptToken(input.tokens.access_token),
    refreshTokenEncrypted: encryptToken(input.tokens.refresh_token!),
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    scopes: input.scopes,
    status: "connected",
    verifiedAt,
    updatedAt: verifiedAt,
  }

  await db
    .insert(kakaoConnections)
    .values(values)
    .onConflictDoUpdate({ target: kakaoConnections.id, set: values })
}

async function refreshKakaoAccessToken(): Promise<string> {
  const config = getKakaoConfiguration()
  if (!config) throw new Error("Kakao OAuth configuration is incomplete")

  const [connection] = await db.select().from(kakaoConnections).where(eq(kakaoConnections.id, 1)).limit(1)
  if (!connection || connection.status !== "connected") throw new Error("Kakao is not connected")
  if (connection.refreshTokenExpiresAt && connection.refreshTokenExpiresAt.getTime() <= Date.now()) {
    throw new Error("Kakao refresh token has expired; reconnect KakaoTalk")
  }

  const refreshToken = decryptToken(connection.refreshTokenEncrypted)
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    refresh_token: refreshToken,
  })
  if (config.clientSecret) body.set("client_secret", config.clientSecret)

  let response: Response
  try {
    response = await fetch(KAKAO_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new KakaoDeliveryError("Kakao token refresh could not reach the provider.", true)
  }

  const tokens = await readJsonResponse<KakaoTokenResponse>(response, "Kakao token refresh")
  if (!tokens.access_token || !Number.isFinite(tokens.expires_in)) {
    throw new KakaoDeliveryError("Kakao token refresh returned an invalid response.", true)
  }

  const updatedAt = new Date()
  const nextRefreshToken = tokens.refresh_token ?? refreshToken
  const refreshTokenExpiresAt = tokens.refresh_token_expires_in
    ? new Date(Date.now() + tokens.refresh_token_expires_in * 1000)
    : connection.refreshTokenExpiresAt

  await db
    .update(kakaoConnections)
    .set({
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted: tokens.refresh_token ? encryptToken(nextRefreshToken) : connection.refreshTokenEncrypted,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      refreshTokenExpiresAt,
      updatedAt,
    })
    .where(eq(kakaoConnections.id, 1))

  return tokens.access_token
}

async function getValidKakaoAccessToken(): Promise<string> {
  const [connection] = await db.select().from(kakaoConnections).where(eq(kakaoConnections.id, 1)).limit(1)
  if (!connection || connection.status !== "connected") throw new Error("Kakao is not connected")

  if (connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000) {
    return decryptToken(connection.accessTokenEncrypted)
  }
  return refreshKakaoAccessToken()
}

function truncate(value: string, maxLength: number): string {
  const characters = Array.from(value.trim())
  if (characters.length <= maxLength) return characters.join("")
  if (maxLength <= 0) return ""
  return `${characters.slice(0, maxLength - 1).join("")}…`
}

function getAdminDashboardUrl(): string {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lotuswellness.app").replace(/\/+$/, "")
  return new URL("/admin", baseUrl).toString()
}

export function createCustomerNotificationText(input: {
  name: string
  phone: string
  email: string
  question: string
  receivedAt: Date
}): string {
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(input.receivedAt)
  const fixed = [
    "🔔 LOTUS WELLNESS — NEW MESSAGE",
    `Admin: ${LOTUS_ADMIN.email}`,
    `Name: ${truncate(input.name, 20)}`,
    `Phone: ${truncate(input.phone, 16)}`,
    `Email: ${truncate(input.email, 26)}`,
  ].join("\n")
  const messagePrefix = "\nMsg: "
  const timestamp = `\nAt: ${localTime}`
  const remaining = 200 - Array.from(fixed + messagePrefix + timestamp).length
  return `${fixed}${messagePrefix}${truncate(input.question, remaining)}${timestamp}`
}

export function createBookingNotificationText(input: {
  reference: string
  customerName: string
  phone: string
  serviceName: string
  durationMinutes: number
  date: string
  time: string
  guests: number
}): string {
  const lines = [
    "LOTUS WELLNESS — NEW BOOKING",
    `Ref: ${truncate(input.reference, 12)}`,
    `Name: ${truncate(input.customerName, 20)}`,
    `Phone: ${truncate(input.phone, 16)}`,
    `Service: ${truncate(input.serviceName, 24)} (${input.durationMinutes}m)`,
    `When: ${input.date} ${input.time} · ${input.guests} guest(s)`,
  ]
  return truncate(lines.join("\n"), 200)
}

export function createTestNotificationText(receivedAt: Date): string {
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(receivedAt)
  return `🔔 LOTUS WELLNESS — TEST\nAdmin: ${LOTUS_ADMIN.email}\nConnection verified.\nAt: ${localTime}`
}

export async function sendKakaoMemo(text: string): Promise<void> {
  const accessToken = await getValidKakaoAccessToken()
  const dashboardUrl = getAdminDashboardUrl()
  const templateObject = {
    object_type: "text",
    text: truncate(text, 200),
    link: { web_url: dashboardUrl, mobile_web_url: dashboardUrl },
    button_title: "Admin dashboard",
  }
  const body = new URLSearchParams({ template_object: JSON.stringify(templateObject) })

  let response: Response
  try {
    response = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new KakaoDeliveryError("Kakao delivery outcome is unknown after a network failure.", false)
  }

  const payload = await response.json().catch(() => null) as { result_code?: number } | null
  if (!response.ok) {
    throw new KakaoDeliveryError(
      `Kakao rejected the notification (${response.status}).`,
      response.status < 500,
    )
  }
  if (!payload || payload.result_code !== 0) {
    throw new KakaoDeliveryError("Kakao did not confirm message delivery.", true)
  }
}
