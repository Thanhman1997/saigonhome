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
      className={cn(locale === "ko" && "h-12 min-w-38 px-8 font-korean-sans text-xl font-bold tracking-wide", className)}
    />
  )
}
