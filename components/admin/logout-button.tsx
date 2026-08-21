"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAdmin } from "@/app/actions/admin-auth"

export function AdminLogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => logoutAdmin())}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" />
      Log out
    </Button>
  )
}
