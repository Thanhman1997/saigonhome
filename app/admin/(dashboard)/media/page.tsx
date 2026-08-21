import { list } from "@vercel/blob"
import { MediaGallery, type MediaFile } from "@/components/admin/media-gallery"

export const metadata = { title: "Media Library" }

export default async function AdminMediaPage() {
  const { blobs } = await list({ prefix: "lotus-wellness/" })

  const files: MediaFile[] = blobs
    .map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
    }))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Media Library</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage images used across the site. Copy a URL to paste it into any image field.
        </p>
      </div>
      <MediaGallery files={files} />
    </div>
  )
}
