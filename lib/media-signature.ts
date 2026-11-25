export type MediaKind = "jpeg" | "png" | "gif" | "webp" | "mp4" | "webm"

export const MEDIA_HEADER_BYTES = 16

const at = (header: Uint8Array, offset: number, bytes: number[]) => bytes.every((byte, index) => header[offset + index] === byte)
const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0))

export function detectMediaKind(header: Uint8Array): MediaKind | null {
  if (at(header, 0, [0xff, 0xd8, 0xff])) return "jpeg"
  if (at(header, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png"
  if (at(header, 0, ascii("GIF8"))) return "gif"
  if (at(header, 0, ascii("RIFF")) && at(header, 8, ascii("WEBP"))) return "webp"
  if (at(header, 4, ascii("ftyp"))) return "mp4"
  if (at(header, 0, [0x1a, 0x45, 0xdf, 0xa3])) return "webm"
  return null
}

const KIND_BY_MIME: Record<string, MediaKind[]> = {
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
}

// The declared MIME type is only trusted when the file's leading bytes agree with it.
export function mediaMatchesDeclaredType(header: Uint8Array, mimeType: string) {
  const kind = detectMediaKind(header)
  if (!kind) return false
  if (mimeType.startsWith("image/")) return ["jpeg", "png", "gif", "webp"].includes(kind)
  return KIND_BY_MIME[mimeType]?.includes(kind) ?? false
}
