"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { Check, Copy, ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteMediaFile, saveExperienceVideo } from "@/app/actions/media"

export type MediaFile = {
  url: string
  blobUrl: string
  pathname: string
  size: number
  uploadedAt: string
  contentType: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setCopied(false), 1500)
      }}
      className="flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
      title="Copy URL"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span className="sr-only">Copy URL</span>
    </button>
  )
}

function MediaCard({ file }: { file: MediaFile }) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-2">
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        {file.contentType.startsWith("video/") ? (
          <video src={file.url} controls preload="metadata" poster="/images/service-deep-tissue.png" className="h-full w-full object-cover" aria-label={file.pathname.split("/").pop() ?? "Uploaded video"} />
        ) : (
          <Image src={file.url} alt="" fill className="object-cover" unoptimized />
        )}
        <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <CopyButton url={file.url} />
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex size-7 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm"
            title="Delete"
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">Delete</span>
          </button>
        </div>
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin text-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="truncate text-xs text-foreground" title={file.pathname}>
          {file.pathname.split("/").pop()}
        </p>
        <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
      </div>
      {confirming && (
        <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
          <p className="text-xs text-foreground">Delete this file permanently?</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-7 flex-1 text-xs"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await deleteMediaFile(file.blobUrl)
                  setConfirming(false)
                })
              }}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs"
              disabled={isPending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function MediaGallery({ files, experienceVideo }: { files: MediaFile[]; experienceVideo: { videoUrl: string; thumbnailUrl: string | null; aspectRatio: number } | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState(experienceVideo?.videoUrl ?? "")
  const [selectedThumbnail, setSelectedThumbnail] = useState(experienceVideo?.thumbnailUrl ?? "")
  const [aspectRatio, setAspectRatio] = useState(experienceVideo?.aspectRatio ?? 16 / 9)
  const [saving, setSaving] = useState(false)

  const videos = files.filter((file) => file.contentType.startsWith("video/"))
  const images = files.filter((file) => file.contentType.startsWith("image/"))

  async function saveVideoSettings() {
    if (!selectedVideo || !selectedThumbnail) return setError("Select both a video and a thumbnail.")
    setSaving(true)
    setError(null)
    try {
      await saveExperienceVideo({ videoUrl: selectedVideo, thumbnailUrl: selectedThumbnail, aspectRatio })
      window.location.reload()
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save video settings") } finally { setSaving(false) }
  }

  async function handleFiles(fileList: FileList) {
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Upload failed")
      }
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {files.length} {files.length === 1 ? "file" : "files"}
        </p>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = ""
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = ""
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            <ImagePlus className="size-3.5" />
            Upload image
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={uploading}
            onClick={() => videoInputRef.current?.click()}
            className="gap-2"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {uploading ? "Uploading…" : "Upload video"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {videos.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div>
            <h2 className="font-medium text-foreground">Experience video</h2>
            <p className="text-sm text-muted-foreground">Choose a video and thumbnail. The display ratio follows the uploaded video.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {videos.map((file) => <Button key={file.url} type="button" size="sm" variant={selectedVideo === file.url ? "default" : "outline"} onClick={() => { setSelectedVideo(file.url); const probe = document.createElement("video"); probe.onloadedmetadata = () => probe.videoWidth && setAspectRatio(probe.videoWidth / probe.videoHeight); probe.src = file.url }}>{file.pathname.split("/").pop()}</Button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {images.map((file) => <Button key={file.url} type="button" size="sm" variant={selectedThumbnail === file.url ? "default" : "outline"} onClick={() => setSelectedThumbnail(file.url)}>{file.pathname.split("/").pop()}</Button>)}
          </div>
          <Button type="button" size="sm" className="self-start" disabled={saving} onClick={saveVideoSettings}>{saving ? "Saving…" : "Save experience video"}</Button>
        </div>
      )}

      {files.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <ImagePlus className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No media uploaded yet. Use Upload image or Upload video to add files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((file) => (
            <MediaCard key={file.url} file={file} />
          ))}
        </div>
      )}
    </div>
  )
}
