import { describe, expect, it } from "vitest"
import { getYouTubeEmbedUrl, getYouTubeVideoId } from "@/lib/youtube"

describe("YouTube video helpers", () => {
  it("extracts an ID from a short YouTube link", () => {
    expect(getYouTubeVideoId("https://youtu.be/AnVV_vbaCTI")).toBe("AnVV_vbaCTI")
  })

  it("supports standard watch and Shorts URLs", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=AnVV_vbaCTI")).toBe("AnVV_vbaCTI")
    expect(getYouTubeVideoId("https://youtube.com/shorts/AnVV_vbaCTI")).toBe("AnVV_vbaCTI")
  })

  it("rejects non-YouTube hosts and malformed IDs", () => {
    expect(getYouTubeVideoId("https://youtube.com.evil.example/watch?v=AnVV_vbaCTI")).toBeNull()
    expect(getYouTubeVideoId("https://youtu.be/not-a-video-id")).toBeNull()
  })

  it("creates an autoplay embed URL for a user-initiated play", () => {
    expect(getYouTubeEmbedUrl("https://youtu.be/AnVV_vbaCTI", true)).toBe(
      "https://www.youtube-nocookie.com/embed/AnVV_vbaCTI?rel=0&autoplay=1",
    )
  })
})
