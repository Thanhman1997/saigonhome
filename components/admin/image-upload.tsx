"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Library, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type LibraryImage = {
  url: string
  pathname: string
  size: number
  uploadedAt: string
  contentType: string
}

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
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([])
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      if (!isMountedRef.current) return
      onChange(data.url)
    } catch (e) {
      if (isMountedRef.current) setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      if (isMountedRef.current) setUploading(false)
    }
  }

  async function openLibrary() {
    setLibraryOpen(true)
    setLoadingLibrary(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not load media library")
      if (isMountedRef.current) setLibraryImages(data.files)
    } catch (e) {
      if (isMountedRef.current) setError(e instanceof Error ? e.message : "Could not load media library")
    } finally {
      if (isMountedRef.current) setLoadingLibrary(false)
    }
  }

  async function searchLibrary(value: string) {
    setSearch(value)
    try {
      const query = value.trim() ? `?search=${encodeURIComponent(value.trim())}` : ""
      const res = await fetch(`/api/admin/media${query}`, { cache: "no-store" })
      const data = await res.json()
      if (res.ok && isMountedRef.current) setLibraryImages(data.files)
    } catch {
      if (isMountedRef.current) setError("Could not search media library")
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className={cn("relative w-40 overflow-hidden rounded-lg border border-dashed border-border bg-muted", aspect)}>
        {value ? <Image src={value} alt="" fill className="object-contain" unoptimized /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImagePlus className="size-6" /></div>}
        {uploading && <div className="absolute inset-0 flex items-center justify-center bg-background/70"><Loader2 className="size-5 animate-spin text-foreground" /></div>}
        {value && !uploading && <button type="button" onClick={() => onChange(null)} className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"><X className="size-3.5" /><span className="sr-only">Remove image</span></button>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = "" }} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="w-fit gap-2"><ImagePlus className="size-3.5" />{value ? "Replace image" : "Upload image"}</Button>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={openLibrary} className="w-fit gap-2"><Library className="size-3.5" />Choose from library</Button>
      </div>
      {libraryOpen && <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">Choose from media library</p><Button type="button" variant="ghost" size="icon" onClick={() => setLibraryOpen(false)} aria-label="Close media library"><X className="size-4" /></Button></div>
        <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(e) => searchLibrary(e.target.value)} placeholder="Search images" className="pl-9" /></div>
        {loadingLibrary ? <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div> : libraryImages.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No images found. Upload an image to add it to the library.</p> : <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">{libraryImages.map((image) => <button key={image.pathname} type="button" onClick={() => { onChange(image.url); setLibraryOpen(false) }} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Image src={image.url} alt={image.pathname.split("/").pop() ?? "Library image"} fill className="object-contain" unoptimized /><span className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-1 py-1 text-left text-[10px] text-foreground opacity-0 transition group-hover:opacity-100">{image.pathname.split("/").pop()}</span></button>)}</div>}
      </div>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
