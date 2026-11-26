export const ADMIN_SESSION_COOKIE = "lw_admin_session"
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

/**
 * The admin dashboard can be loaded inside a cross-site iframe (e.g. the v0
 * preview). A `SameSite=Lax` cookie is not sent on requests that originate
 * from a cross-site iframe (only top-level navigations get the Lax
 * exception), so mutating server actions inside the iframe would silently
 * fail auth and bounce the user back to the login screen. `SameSite=None`
 * fixes that, but browsers require `Secure` to accept it, which only works
 * over HTTPS. Detect the protocol from the forwarded proxy header so local
 * HTTP development still works with a `Lax` cookie.
 */
export async function getAdminSessionCookieOptions() {
  const { headers } = await import("next/headers")
  const headerStore = await headers()
  const forwardedHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? ""
  const isHttps = headerStore.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production"
  const isEmbeddedPreview = /vusercontent\.net|vercel\.app/i.test(forwardedHost)

  return isHttps && isEmbeddedPreview
    ? { secure: true as const, sameSite: "none" as const }
    : { secure: isHttps, sameSite: "lax" as const }
}

const encoder = new TextEncoder()

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function sha256Hex(input: string) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(input))))
}

async function hashesMatch(a: string, b: string) {
  const [hashA, hashB] = await Promise.all([sha256Hex(a), sha256Hex(b)])
  return hashA === hashB
}

async function hmacKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage])
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SECRET
  const email = process.env.ADMIN_EMAIL
  if (!secret || !email) return null
  return `lotus-wellness-admin-session:${secret}:${email.trim().toLowerCase()}`
}

/**
 * Creates a signed, self-expiring session token: `<issuedAtMs>.<nonce>.<hmac>`.
 * The signature binds the issue time, so the expiry cannot be extended by
 * editing the cookie, and rotating ADMIN_SECRET invalidates every session.
 */
export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getSessionSecret()
  if (!secret) return null
  const issuedAt = Date.now()
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const payload = `${issuedAt}.${nonce}`
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), encoder.encode(payload))
  return `${payload}.${toHex(new Uint8Array(signature))}`
}

function hexToBytes(hex: string) {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

export async function verifyAdminSessionToken(token: string | null | undefined): Promise<boolean> {
  const secret = getSessionSecret()
  if (!secret || !token) return false

  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [issuedAtRaw, nonce, signatureHex] = parts
  const issuedAt = Number(issuedAtRaw)
  if (!Number.isFinite(issuedAt) || !nonce) return false

  const age = Date.now() - issuedAt
  if (age < 0 || age > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) return false

  const signature = hexToBytes(signatureHex)
  if (!signature) return false

  return crypto.subtle.verify("HMAC", await hmacKey(secret, "verify"), signature, encoder.encode(`${issuedAtRaw}.${nonce}`))
}

/** True when the current request carries a valid, unexpired admin session cookie. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
}

/** Throws when the current request is not an authenticated admin. Use at the top of every admin action. */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized")
}

/**
 * Validates submitted credentials against ADMIN_EMAIL / ADMIN_PASSWORD.
 * Runs entirely server-side and compares hashes rather than raw strings.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const expectedEmail = process.env.ADMIN_EMAIL
  const expectedPassword = process.env.ADMIN_PASSWORD
  if (!expectedEmail || !expectedPassword) return false

  const [emailMatches, passwordMatches] = await Promise.all([
    hashesMatch(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase()),
    hashesMatch(password, expectedPassword),
  ])

  return emailMatches && passwordMatches
}
