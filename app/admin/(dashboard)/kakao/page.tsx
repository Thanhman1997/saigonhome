import { KakaoNotificationSettings } from "@/components/admin/kakao-notification-settings"
import { getKakaoConfiguration } from "@/lib/kakao"
import { getKakaoSettingsSnapshot } from "@/lib/kakao-notifications"

export const metadata = { title: "KakaoTalk Notifications" }

type KakaoSettingsPageProps = {
  searchParams: Promise<{ error?: string; connected?: string }>
}

export default async function KakaoSettingsPage({ searchParams }: KakaoSettingsPageProps) {
  const [snapshot, params] = await Promise.all([getKakaoSettingsSnapshot(), searchParams])

  return (
    <KakaoNotificationSettings
      snapshot={snapshot}
      canConnect={Boolean(getKakaoConfiguration())}
      errorCode={params.error}
      connected={params.connected === "1"}
    />
  )
}
