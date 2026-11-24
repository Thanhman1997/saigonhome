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
      className={cn(locale === "ko" && "h-12 min-w-[120px] px-4 font-korean-serif text-xl font-bold tracking-[0.16em]", className)}
    />
  )
}
