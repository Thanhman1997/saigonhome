import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lotus Wellness",
    short_name: "Lotus Wellness",
    description: "Professional mobile massage in Ho Chi Minh City.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FCE2C1",
    theme_color: "#FCE2C1",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  }
}
