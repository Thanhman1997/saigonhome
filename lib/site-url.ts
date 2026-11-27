const FALLBACK_SITE_URL = "https://lotuswellness.app"

function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const previewDeployment = process.env.VERCEL_ENV === "preview" ? process.env.VERCEL_URL?.trim() : undefined
  const candidate = previewDeployment || configured || (production ? withProtocol(production) : FALLBACK_SITE_URL)
  return withProtocol(candidate).replace(/\/+$/, "")
}
