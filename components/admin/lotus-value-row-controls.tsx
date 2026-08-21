"use client"

import { useTransition } from "react"
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
import { toggleLotusValueActive, deleteLotusValue, reorderLotusValue } from "@/app/actions/lotus-values"

export function LotusValueRowControls({
  valueId,
  active,
  canMoveUp,
  canMoveDown,
}: {
  valueId: number
  active: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        disabled={isPending || !canMoveUp}
        onClick={() => startTransition(() => reorderLotusValue(valueId, "up"))}
      >
        <ArrowUp className="size-4" />
        <span className="sr-only">Move up</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        disabled={isPending || !canMoveDown}
        onClick={() => startTransition(() => reorderLotusValue(valueId, "down"))}
      >
        <ArrowDown className="size-4" />
        <span className="sr-only">Move down</span>
      </Button>
      <div className="flex items-center gap-2 px-1">
        <Switch
          id={`value-${valueId}`}
          checked={active}
          disabled={isPending}
          onCheckedChange={(checked) => startTransition(() => toggleLotusValueActive(valueId, checked))}
        />
        <Label htmlFor={`value-${valueId}`} className="text-xs text-muted-foreground">
          {active ? "Active" : "Inactive"}
        </Label>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
            <span className="sr-only">Delete value</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this value?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => startTransition(() => deleteLotusValue(valueId))}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
