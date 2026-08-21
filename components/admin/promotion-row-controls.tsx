"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
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
import { togglePromotionActive, deletePromotion } from "@/app/actions/promotions"

export function PromotionRowControls({ promotionId, active }: { promotionId: number; active: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-2 px-1">
        <Switch
          id={`promo-${promotionId}`}
          checked={active}
          disabled={isPending}
          onCheckedChange={(checked) => startTransition(() => togglePromotionActive(promotionId, checked))}
        />
        <Label htmlFor={`promo-${promotionId}`} className="text-xs text-muted-foreground">
          {active ? "Active" : "Inactive"}
        </Label>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
            <span className="sr-only">Delete promotion</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The promotion will be permanently removed from the public site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => startTransition(() => deletePromotion(promotionId))}
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
