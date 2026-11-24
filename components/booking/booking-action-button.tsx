"use client"

import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/language-provider"
import { cn } from "@/lib/utils"

type BookingActionButtonProps = Omit<ComponentProps<typeof Button>, "variant">

export function BookingActionButton({ className, ...props }: BookingActionButtonProps) {
  const { locale } = useLanguage()

  return (
    <Button
      {...props}
      variant="booking"
      className={cn(locale === "ko" && "font-korean-sans text-base font-semibold", className)}
    />
  )
}
