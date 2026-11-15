import { list } from "@vercel/blob"
import { ExperienceVideoManager, type LibraryFile } from "@/components/admin/experience-video-manager"
import { getExperienceVideoAdmin } from "@/lib/admin-data"

export const metadata = { title: "Video publishing" }

export default async function AdminVideoPage() {
  let blobs: Awaited<ReturnType<typeof list>>["blobs"] = []
  let storageError = false
  try {
    blobs = (await list({ prefix: "lotus-wellness/" })).blobs
  } catch {
    storageError = true
  }

  const library: LibraryFile[] = blobs
    .map((blob) => ({
      url: `/api/media?pathname=${encodeURIComponent(blob.pathname)}`,
      name: blob.pathname.split("/").pop() ?? blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
      kind: /\.(mp4|webm)$/i.test(blob.pathname) ? ("video" as const) : ("image" as const),
    }))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  const current = await getExperienceVideoAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Video publishing</h1>
        <p className="text-sm text-muted-foreground">
          Upload and publish a video to the homepage, or select a previous upload. Without an explicit selection, the latest upload is shown.
        </p>
      </div>
      {storageError && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load files from storage. The Blob store may be suspended or unreachable.
        </p>
      )}
      <ExperienceVideoManager current={current} library={library} />
    </div>
  )
}
