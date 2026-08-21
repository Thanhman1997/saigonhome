import Image from "next/image"
import { getAllTherapistsAdmin } from "@/lib/admin-data"
import { TherapistFormDialog } from "@/components/admin/therapist-form-dialog"
import { TherapistAvailableToggle } from "@/components/admin/therapist-available-toggle"
import { CreateTherapistForm } from "@/components/admin/create-therapist-form"
import { ArchiveTherapistButton } from "@/components/admin/archive-therapist-button"

export const metadata = { title: "Therapists" }

export default async function AdminTherapistsPage() {
  const therapists = await getAllTherapistsAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Therapists</h1>
          <p className="text-sm text-muted-foreground">
            {therapists.length} therapist{therapists.length === 1 ? "" : "s"} · edit profile details, photo, and availability
          </p>
        </div>
        <CreateTherapistForm />
      </div>

      <div className="flex flex-col gap-3">
        {therapists.map((therapist) => (
          <div
            key={therapist.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-1 items-center gap-4">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {therapist.photoUrl && <Image src={therapist.photoUrl} alt="" fill className="object-cover" />}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{therapist.code}</span>
                <span className="text-xs text-muted-foreground">
                  {therapist.experienceYears != null ? `${therapist.experienceYears} yrs experience` : "—"}
                  {therapist.locationEn ? ` · ${therapist.locationEn}` : ""}
                </span>
                <span className={`text-xs font-medium ${therapist.status === "active" ? "text-emerald-600" : therapist.status === "inactive" ? "text-destructive" : "text-amber-600"}`}>
                  {therapist.status === "active" ? "Public" : therapist.status === "inactive" ? "Inactive" : "Draft"} · limit {therapist.maxBookingsPerDay}/day
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TherapistAvailableToggle therapistId={therapist.id} available={therapist.available} />
              <TherapistFormDialog therapist={therapist} />
              <ArchiveTherapistButton therapistId={therapist.id} />
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
