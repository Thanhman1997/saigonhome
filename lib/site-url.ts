const FALLBACK_SITE_URL = "https://lotuswellness.app"
const EMAIL_DOMAIN = "lotuswellness.app"

function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function parseUrl(value: string) {
  const url = new URL(withProtocol(value))
  if (url.username || url.password || url.search || url.hash) throw new Error("Configured site URL must not contain credentials, a query, or a fragment")
  return url
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const previewDeployment = process.env.VERCEL_ENV === "preview" ? process.env.VERCEL_URL?.trim() : undefined
  const candidate = previewDeployment || configured || (production ? withProtocol(production) : FALLBACK_SITE_URL)
  return withProtocol(candidate).replace(/\/+$/, "")
}

export function getEmailSiteUrl(): string {
  if (process.env.VERCEL_ENV === "preview") {
    const preview = process.env.PREVIEW_SITE_URL?.trim()
    if (!preview) {
      const deploymentHost = process.env.VERCEL_URL?.trim()
      if (!deploymentHost || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.vercel\.app$/i.test(deploymentHost)) {
        throw new Error("VERCEL_URL must point to the current HTTPS Vercel Preview deployment")
      }
      return parseUrl(deploymentHost).origin
    }

    const url = parseUrl(preview)
    const hostname = url.hostname.toLowerCase()
    if (url.protocol !== "https:" || url.port || hostname === EMAIL_DOMAIN || !hostname.endsWith(`.${EMAIL_DOMAIN}`)) {
      throw new Error("PREVIEW_SITE_URL must be an HTTPS subdomain of lotuswellness.app assigned to the Preview deployment")
    }
    return url.origin
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const candidate = configured || (production ? withProtocol(production) : FALLBACK_SITE_URL)
  const url = parseUrl(candidate)

  if (process.env.VERCEL_ENV === "production" && (url.protocol !== "https:" || url.port || url.hostname.toLowerCase() !== EMAIL_DOMAIN)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be https://lotuswellness.app in Production")
  }

  if (process.env.NODE_ENV === "production" && (url.protocol !== "https:" || url.port || (url.hostname.toLowerCase() !== EMAIL_DOMAIN && !url.hostname.toLowerCase().endsWith(`.${EMAIL_DOMAIN}`)))) {
    throw new Error("Production email links must use lotuswellness.app or one of its HTTPS subdomains")
  }

  return url.origin
}
