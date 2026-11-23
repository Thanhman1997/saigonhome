// Vercel overwrites these headers at the edge, so the first entry is the connecting client.
export function clientIpFromHeaders(h: Pick<Headers, "get">): string {
  for (const name of ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"]) {
    const value = h.get(name)?.split(",")[0]?.trim()
    if (value) return value
  }
  return "unknown"
}
