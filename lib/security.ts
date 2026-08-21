const loginAttempts = new Map<string, { count: number; resetAt: number }>()

export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function isRateLimited(key: string, limit = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now()
  for (const [entryKey, entry] of loginAttempts) {
    if (entry.resetAt <= now) loginAttempts.delete(entryKey)
  }
  if (loginAttempts.size >= 10_000 && !loginAttempts.has(key)) {
    const oldest = [...loginAttempts.entries()].sort(([, a], [, b]) => a.resetAt - b.resetAt)[0]?.[0]
    if (oldest) loginAttempts.delete(oldest)
  }
  const current = loginAttempts.get(key)
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  current.count += 1
  return current.count > limit
}

export function makeExpiringSessionToken(token: string): string {
  return `${Date.now()}.${token}`
}

export function splitExpiringSessionToken(value: string): { issuedAt: number; token: string } | null {
  const separator = value.indexOf(".")
  if (separator < 1) return null
  const issuedAt = Number(value.slice(0, separator))
  const token = value.slice(separator + 1)
  if (!Number.isFinite(issuedAt) || !token) return null
  return { issuedAt, token }
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60
export const ADMIN_SESSION_MAX_AGE_MS = ADMIN_SESSION_MAX_AGE_SECONDS * 1000
