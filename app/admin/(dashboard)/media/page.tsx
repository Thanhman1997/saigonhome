import { list } from "@vercel/blob"
import { MediaGallery, type MediaFile } from "@/components/admin/media-gallery"
import { getExperienceVideoAdmin } from "@/lib/admin-data"

export const metadata = { title: "Media Library" }

export default async function AdminMediaPage() {
  const { blobs } = await list({ prefix: "lotus-wellness/" })

  const files: MediaFile[] = blobs
    .map((blob) => ({
      url: `/api/media?pathname=${encodeURIComponent(blob.pathname)}`,
      blobUrl: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
      contentType: /\.webm$/i.test(blob.pathname) ? "video/webm" : /\.mp4$/i.test(blob.pathname) ? "video/mp4" : "image/*",
    }))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  const experienceVideo = await getExperienceVideoAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Media Library</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage images and short videos used across the site. Copy a URL to use media in content fields.
        </p>
      </div>
      <MediaGallery files={files} experienceVideo={experienceVideo} />
    </div>
  )
}
