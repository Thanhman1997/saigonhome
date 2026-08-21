"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { loginAdmin } from "@/app/actions/admin-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Login"}
    </Button>
  )
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState(loginAdmin, undefined)

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-5" />
          </div>
          <h1 className="text-lg font-semibold text-card-foreground">Lotus Wellness Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in with your admin email and password.</p>
        </div>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoFocus required autoComplete="username" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <SubmitButton />
        </form>
      </div>
    </main>
  )
}
