/** @type {import('next').NextConfig} */
const isDevelopment=process.env.NODE_ENV!=="production"
const scriptSources=["'self'","'unsafe-inline'",...(isDevelopment?["'unsafe-eval'"]:[])]

const nextConfig={images:{remotePatterns:[{protocol:"https",hostname:"hebbkx1anhila5yf.public.blob.vercel-storage.com"}],formats:["image/avif","image/webp"]},async headers(){return [{source:"/:path*",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"Strict-Transport-Security",value:"max-age=63072000"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},{key:"Content-Security-Policy-Report-Only",value:`default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src ${scriptSources.join(" ")}; connect-src 'self' https://vitals.vercel-insights.com; font-src 'self' data:;`}]}]}}
export default nextConfig
