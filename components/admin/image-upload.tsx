"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function ImageUpload({
  label,
  name,
  value,
  onChange,
  aspect = "aspect-[4/5]",
}: {
  label: string
  name: string
  value: string | null
  onChange: (url: string | null) => void
  aspect?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      onChange(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={value ?? ""} />
      <div
        className={cn(
          "relative w-40 overflow-hidden rounded-lg border border-dashed border-border bg-muted",
          aspect,
        )}
      >
        {value ? (
          <Image src={value} alt="" fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImagePlus className="size-6" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin text-foreground" />
          </div>
        )}
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
          >
            <X className="size-3.5" />
            <span className="sr-only">Remove image</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-fit gap-2"
      >
        <ImagePlus className="size-3.5" />
        {value ? "Replace image" : "Upload image"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
