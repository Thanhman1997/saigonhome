"use client"

import { useTransition } from "react"
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
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
import { toggleFaqActive, deleteFaq, moveFaq } from "@/app/actions/faq"

export function FaqRowControls({
  faqId,
  active,
  disableUp,
  disableDown,
}: {
  faqId: number
  active: boolean
  disableUp: boolean
  disableDown: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground disabled:opacity-30"
        disabled={disableUp || isPending}
        onClick={() => startTransition(() => moveFaq(faqId, "up"))}
      >
        <ArrowUp className="size-4" />
        <span className="sr-only">Move up</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground disabled:opacity-30"
        disabled={disableDown || isPending}
        onClick={() => startTransition(() => moveFaq(faqId, "down"))}
      >
        <ArrowDown className="size-4" />
        <span className="sr-only">Move down</span>
      </Button>
      <div className="flex items-center gap-2 px-1">
        <Switch
          id={`faq-${faqId}`}
          checked={active}
          disabled={isPending}
          onCheckedChange={(checked) => startTransition(() => toggleFaqActive(faqId, checked))}
        />
        <Label htmlFor={`faq-${faqId}`} className="text-xs text-muted-foreground">
          {active ? "Active" : "Inactive"}
        </Label>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
            <span className="sr-only">Delete FAQ</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question will be permanently removed from the public site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => startTransition(() => deleteFaq(faqId))}
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
