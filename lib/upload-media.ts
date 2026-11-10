import { upload } from "@vercel/blob/client"

const SERVER_UPLOAD_LIMIT = 4 * 1024 * 1024

function mediaUrl(pathname: string) {
  return `/api/media?pathname=${encodeURIComponent(pathname)}`
}

export async function uploadMedia(file: File): Promise<string> {
  const isVideo = file.type === "video/mp4" || file.type === "video/webm"

  if (!isVideo && file.size <= SERVER_UPLOAD_LIMIT) {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Upload failed")
    return data.url as string
  }

  if (!file.type) throw new Error("Unsupported file type")

  const safeName = file.name.replace(/[^\w.\-]+/g, "-")
  const blob = await upload(`lotus-wellness/${Date.now()}-${safeName}`, file, {
    access: "private",
    handleUploadUrl: "/api/admin/upload/client",
    contentType: file.type,
    multipart: file.size > 20 * 1024 * 1024,
  })
  return mediaUrl(blob.pathname)
}
