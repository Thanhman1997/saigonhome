import { ExperienceVideoManager } from "@/components/admin/experience-video-manager"
import { getExperienceVideoAdmin } from "@/lib/admin-data"

export const metadata = { title: "Video management" }

export default async function AdminVideoPage() {
  const current = await getExperienceVideoAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Video management</h1>
        <p className="text-sm text-muted-foreground">
          Publish a YouTube video and choose the thumbnail visitors see before playback on the homepage.
        </p>
      </div>
      <ExperienceVideoManager current={current} />
    </div>
  )
}
