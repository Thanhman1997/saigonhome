export const DEFAULT_EXPERIENCE_VIDEO_URL = "https://youtu.be/AnVV_vbaCTI"

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

export function getYouTubeVideoId(value: string | null | undefined) {
  if (!value?.trim()) return null

  try {
    const url = new URL(value.trim())
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "")
    let videoId: string | null = null

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null
    } else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(hostname)) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v")
      } else {
        videoId = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null
      }
    }

    return videoId && YOUTUBE_VIDEO_ID.test(videoId) ? videoId : null
  } catch {
    return null
  }
}

export function getYouTubeEmbedUrl(value: string | null | undefined, autoplay = false) {
  const videoId = getYouTubeVideoId(value)
  if (!videoId) return null

  const params = new URLSearchParams({ rel: "0" })
  if (autoplay) params.set("autoplay", "1")

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}
