import { ExperienceVideoManager } from "@/components/admin/experience-video-manager"
import { getExperienceVideoAdmin } from "@/lib/admin-data"

export const metadata = { title: "Video publishing" }

export default async function AdminVideoPage() {
  const current = await getExperienceVideoAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Video publishing</h1>
        <p className="text-sm text-muted-foreground">
          Add a YouTube video link to publish a video on the Lotus Wellness homepage.
        </p>
      </div>
      <ExperienceVideoManager current={current} />
    </div>
  )
}
