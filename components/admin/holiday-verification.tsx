"use client"

import { toggleHolidayVerified } from "@/app/actions/holidays"
import { Button } from "@/components/ui/button"

export function HolidayVerification({ id, verified }: { id: number; verified: boolean }) {
  return <Button type="button" size="sm" variant={verified ? "default" : "outline"} onClick={() => toggleHolidayVerified(id, !verified)}>{verified ? "Verified" : "Mark verified"}</Button>
}
