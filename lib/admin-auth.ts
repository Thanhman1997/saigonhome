export const ADMIN_SESSION_COOKIE = "lw_admin_session"

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
  const isHttps =
    headerStore.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production"

  return isHttps
    ? { secure: true as const, sameSite: "none" as const }
    : { secure: false as const, sameSite: "lax" as const }
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function hashesMatch(a: string, b: string) {
  const [hashA, hashB] = await Promise.all([sha256Hex(a), sha256Hex(b)])
  return hashA === hashB
}

/**
 * Derives the expected session token from ADMIN_SECRET and ADMIN_EMAIL.
 * The cookie stores only this derived value (never raw credentials), and a
 * request is considered authenticated when its cookie matches this token.
 */
export async function getExpectedAdminSessionToken(): Promise<string | null> {
  const secret = process.env.ADMIN_SECRET
  const email = process.env.ADMIN_EMAIL
  if (!secret || !email) return null
  return sha256Hex(`lotus-wellness-admin-session:${secret}:${email.trim().toLowerCase()}`)
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
