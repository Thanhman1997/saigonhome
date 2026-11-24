"use client"

import type { ComponentProps, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/language-provider"
import { cn } from "@/lib/utils"

type BookingCtaButtonProps = Omit<ComponentProps<typeof Button>, "children" | "size" | "type" | "variant"> & {
  children: ReactNode
}

export function BookingCtaButton({ className, children, ...props }: BookingCtaButtonProps) {
  const { locale } = useLanguage()

  return (
    <Button
      {...props}
      type="button"
      className={cn(
        className,
        "h-[42px] w-[130px] shrink-0 rounded-full bg-lotus-pink px-4 py-0 font-bold uppercase leading-none text-lotus-pink-foreground transition-transform duration-200 hover:-translate-y-0.5 hover:bg-lotus-pink/90",
        locale === "ko"
          ? "h-12 w-[120px] px-4 font-korean-serif text-xl font-bold tracking-[0.16em]"
          : "!font-sans text-sm",
      )}
    >
      {children}
    </Button>
  )
}
