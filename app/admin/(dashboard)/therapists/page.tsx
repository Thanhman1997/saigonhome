import Image from "next/image"
import { UserRound } from "lucide-react"
import { getAllTherapistsAdmin } from "@/lib/admin-data"
import { TherapistFormDialog } from "@/components/admin/therapist-form-dialog"
import { TherapistAvailableToggle } from "@/components/admin/therapist-available-toggle"
import { TherapistVisibleToggle } from "@/components/admin/therapist-visible-toggle"
import { CreateTherapistForm } from "@/components/admin/create-therapist-form"

export const metadata = { title: "Therapists" }

export default async function AdminTherapistsPage() {
  const therapists = await getAllTherapistsAdmin()
  const hiddenCount = therapists.filter((therapist) => !therapist.visible).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Therapists</h1>
          <p className="text-sm text-muted-foreground">
            {therapists.length} nhân viên · {therapists.length - hiddenCount} đang hiển thị · {hiddenCount} đang ẩn
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Nhân viên bị ẩn sẽ không xuất hiện trên website và không thể được chọn khi đặt lịch.
          </p>
        </div>
        <CreateTherapistForm />
      </div>

      <div className="flex flex-col gap-3">
        {therapists.map((therapist) => (
          <div
            key={therapist.id}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-1 items-center gap-4">
              <div
                className={`relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-muted ${
                  therapist.visible ? "" : "opacity-50 grayscale"
                }`}
              >
                {therapist.photoUrl ? (
                  <Image src={therapist.photoUrl} alt={`Ảnh ${therapist.code}`} fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <UserRound className="size-6" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{therapist.code}</span>
                  {!therapist.visible && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Đã ẩn</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {therapist.experienceYears != null ? `${therapist.experienceYears} yrs experience` : "—"}
                  {therapist.locationEn ? ` · ${therapist.locationEn}` : ""}
                </span>
                {!therapist.photoUrl && <span className="text-xs text-destructive">Chưa có ảnh</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <TherapistVisibleToggle therapistId={therapist.id} visible={therapist.visible} />
                <TherapistAvailableToggle therapistId={therapist.id} available={therapist.available} />
              </div>
              <TherapistFormDialog therapist={therapist} />
            </div>
          </div>
        ))}
        {therapists.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            No therapists yet.
          </div>
        )}
      </div>
    </div>
  )
}
