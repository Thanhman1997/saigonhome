import { describe, expect, it } from "vitest"
import { mediaMatchesDeclaredType } from "./media-signature"

const bytes = (...values: number[]) => Uint8Array.from([...values, ...new Array(16 - values.length).fill(0)])
const text = (offset: number, value: string) => {
  const header = new Uint8Array(16)
  header.set([...value].map((char) => char.charCodeAt(0)), offset)
  return header
}

describe("media signature", () => {
  it("accepts matching images and videos", () => {
    expect(mediaMatchesDeclaredType(bytes(0xff, 0xd8, 0xff, 0xe0), "image/jpeg")).toBe(true)
    expect(mediaMatchesDeclaredType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), "image/png")).toBe(true)
    expect(mediaMatchesDeclaredType(text(4, "ftypisom"), "video/mp4")).toBe(true)
    expect(mediaMatchesDeclaredType(bytes(0x1a, 0x45, 0xdf, 0xa3), "video/webm")).toBe(true)
  })

  it("rejects a file whose bytes do not match the declared type", () => {
    expect(mediaMatchesDeclaredType(text(0, "<html><script>"), "video/mp4")).toBe(false)
    expect(mediaMatchesDeclaredType(text(0, "<svg xmlns="), "image/png")).toBe(false)
    expect(mediaMatchesDeclaredType(text(4, "ftypisom"), "video/webm")).toBe(false)
    expect(mediaMatchesDeclaredType(bytes(0x1a, 0x45, 0xdf, 0xa3), "video/mp4")).toBe(false)
    expect(mediaMatchesDeclaredType(text(4, "ftypisom"), "image/jpeg")).toBe(false)
  })
})
