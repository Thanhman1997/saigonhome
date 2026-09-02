import { getServicesContentAdmin } from "@/app/actions/services-content"
import { ServicesContentForm } from "@/components/admin/services-content-form"
import Link from "next/link"

export const metadata = { title: "Services Content" }

const defaults = {
  kickerEn: "Our Services", kickerKo: "모든 니즈를 위한 테라피", kickerVi: "Liệu trình cho mọi nhu cầu",
  titleEn: "Therapies for every need", titleKo: "모든 니즈를 위한 테라피", titleVi: "Liệu trình cho mọi nhu cầu",
  subtitleEn: "Nine signature treatments, each tailored to how you want to feel.", subtitleKo: "원하는 느낌에 맞춘 9가지 시그니처 트리트먼트.", subtitleVi: "Chín liệu trình đặc trưng, được thiết kế theo cảm nhận bạn mong muốn.",
}

export default async function ServicesContentPage() {
  const content = await getServicesContentAdmin()
  return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-semibold text-foreground">Services Content</h1><p className="mt-1 text-sm text-muted-foreground">Edit the Services section copy in all three languages.</p><Link href="/admin/content" className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline">Edit font, size, color, and alignment</Link></div><ServicesContentForm content={{ kickerEn: content?.kickerEn ?? defaults.kickerEn, kickerKo: content?.kickerKo ?? defaults.kickerKo, kickerVi: content?.kickerVi ?? defaults.kickerVi, titleEn: content?.titleEn ?? defaults.titleEn, titleKo: content?.titleKo ?? defaults.titleKo, titleVi: content?.titleVi ?? defaults.titleVi, subtitleEn: content?.subtitleEn ?? defaults.subtitleEn, subtitleKo: content?.subtitleKo ?? defaults.subtitleKo, subtitleVi: content?.subtitleVi ?? defaults.subtitleVi }} /></div>
}
