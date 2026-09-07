/** @type {import('next').NextConfig} */
// The CSP below is Report-Only: it only logs, it never blocks. Some runtime
// dependencies (HMR in dev, certain analytics/runtime code in production) use
// `eval`, which the browser surfaces as a CSP console warning. Since a
// report-only policy provides no protection until enforced, allow
// `unsafe-eval` in the script-src to remove the noisy warning. If this CSP is
// later switched to the enforcing `Content-Security-Policy`, revisit this and
// prefer removing the eval usage / using a nonce instead.
const scriptSrc = "script-src 'self' 'unsafe-inline' 'unsafe-eval'"

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "img-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline'",
              scriptSrc,
              "connect-src 'self' https://vitals.vercel-insights.com",
              "font-src 'self' data:",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
