"use client"

import { useState, useTransition } from "react"
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toggleServiceActive, deleteService, reorderService, type ServiceActionResult } from "@/app/actions/services"

export function ServiceRowControls({
  serviceId,
  active,
  canMoveUp,
  canMoveDown,
}: {
  serviceId: number
  active: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<ServiceActionResult>) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) setError(result.error)
      } catch {
        setError("The request failed. Please try again.")
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        disabled={isPending || !canMoveUp}
        onClick={() => run(() => reorderService(serviceId, "up"))}
      >
        <ArrowUp className="size-4" />
        <span className="sr-only">Move up</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        disabled={isPending || !canMoveDown}
        onClick={() => run(() => reorderService(serviceId, "down"))}
      >
        <ArrowDown className="size-4" />
        <span className="sr-only">Move down</span>
      </Button>
      <div className="flex items-center gap-2 px-1">
        <Switch
          id={`service-${serviceId}`}
          checked={active}
          disabled={isPending}
          onCheckedChange={(checked) => run(() => toggleServiceActive(serviceId, checked))}
        />
        <Label htmlFor={`service-${serviceId}`} className="text-xs text-muted-foreground">
          {active ? "Active" : "Inactive"}
        </Label>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
            <span className="sr-only">Delete service</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The service and its durations will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => run(() => deleteService(serviceId))}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && (
        <p role="alert" className="basis-full text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
