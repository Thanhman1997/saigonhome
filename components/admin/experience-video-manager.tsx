"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearExperienceVideo, saveExperienceVideo } from "@/app/actions/media"
import { uploadMedia } from "@/lib/upload-media"

export type LibraryFile = {
  url: string
  name: string
  size: number
  uploadedAt: string
  kind: "video" | "image"
}

type Current = { videoUrl: string; thumbnailUrl: string | null; aspectRatio: number } | null

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function probeRatio(url: string) {
  return new Promise<number>((resolve) => {
    const probe = document.createElement("video")
    probe.preload = "metadata"
    probe.onloadedmetadata = () => resolve(probe.videoWidth && probe.videoHeight ? probe.videoWidth / probe.videoHeight : 16 / 9)
    probe.onerror = () => resolve(16 / 9)
    probe.src = url
  })
}

export function ExperienceVideoManager({ current, library }: { current: Current; library: LibraryFile[] }) {
  const router = useRouter()
  const videoInput = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<null | "video" | "image" | "save" | "clear">(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState(current?.videoUrl ?? "")
  const [thumbnailUrl, setThumbnailUrl] = useState(current?.thumbnailUrl ?? "")
  const [ratio, setRatio] = useState(current?.aspectRatio ?? 16 / 9)

  const videos = library.filter((file) => file.kind === "video")
  const images = library.filter((file) => file.kind === "image")
  const dirty = videoUrl !== (current?.videoUrl ?? "") || thumbnailUrl !== (current?.thumbnailUrl ?? "")

  async function chooseVideo(url: string) {
    setVideoUrl(url)
    setNotice(null)
    setRatio(await probeRatio(url))
  }

  async function handleVideoFile(file: File) {
    setError(null)
    setNotice(null)
    setBusy("video")
    try {
      const url = await uploadMedia(file)
      const detected = await probeRatio(url)
      await saveExperienceVideo({ videoUrl: url, thumbnailUrl: thumbnailUrl || null, aspectRatio: detected })
      setVideoUrl(url)
      setRatio(detected)
      setNotice("Video uploaded and published on the homepage.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setBusy(null)
    }
  }

  async function handleImageFile(file: File) {
    setError(null)
    setNotice(null)
    setBusy("image")
    try {
      setThumbnailUrl(await uploadMedia(file))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setBusy(null)
    }
  }

  async function save() {
    if (!videoUrl) return setError("Choose or upload a video first.")
    setError(null)
    setNotice(null)
    setBusy("save")
    try {
      await saveExperienceVideo({ videoUrl, thumbnailUrl: thumbnailUrl || null, aspectRatio: ratio })
      setNotice("Saved. The homepage now shows this video.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusy(null)
    }
  }

  async function clear() {
    setError(null)
    setNotice(null)
    setBusy("clear")
    try {
      await clearExperienceVideo()
      setVideoUrl("")
      setThumbnailUrl("")
      setNotice("Video removed. The homepage uses the most recent uploaded video, if any.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4" aria-labelledby="video-preview-title">
        <h2 id="video-preview-title" className="font-medium text-foreground">Current video</h2>
        {videoUrl ? (
          <div className="mx-auto w-full overflow-hidden rounded-md bg-foreground" style={{ aspectRatio: ratio, maxWidth: `calc(60vh * ${ratio})` }}>
            <video key={videoUrl} src={videoUrl} poster={thumbnailUrl || undefined} controls preload="metadata" className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-center">
            <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No video selected yet. Upload one to show it on the homepage.</p>
          </div>
        )}
        {videoUrl && <p className="text-xs text-muted-foreground">Detected ratio: {ratio.toFixed(2)}:1</p>}

        <input ref={videoInput} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleVideoFile(file); e.target.value = "" }} />
        <input ref={imageInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImageFile(file); e.target.value = "" }} />

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy !== null} onClick={() => videoInput.current?.click()} className="gap-2">
            {busy === "video" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {busy === "video" ? "Uploading…" : "Upload new video"}
          </Button>
          <Button type="button" variant="outline" disabled={busy !== null || !dirty || !videoUrl} onClick={save} className="gap-2">
            {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save changes
          </Button>
          {current && (
            <Button type="button" variant="outline" disabled={busy !== null} onClick={clear} className="gap-2 text-destructive">
              {busy === "clear" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Remove video
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">MP4 or WebM, up to 150 MB. Uploading publishes the video immediately.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
      </section>

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4" aria-labelledby="video-library-title">
          <h2 id="video-library-title" className="font-medium text-foreground">Choose from uploaded videos</h2>
          {videos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploaded videos yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {videos.map((file) => (
                <li key={file.url}>
                  <button
                    type="button"
                    onClick={() => void chooseVideo(file.url)}
                    aria-pressed={videoUrl === file.url}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted aria-pressed:border-accent aria-pressed:bg-muted"
                  >
                    <span className="truncate text-foreground">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4" aria-labelledby="video-cover-title">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="video-cover-title" className="font-medium text-foreground">Cover image (optional)</h2>
              <p className="text-xs text-muted-foreground">Shown before the video plays. Leave empty to use the default cover.</p>
            </div>
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => imageInput.current?.click()} className="gap-2">
              {busy === "image" ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              Upload
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setThumbnailUrl("")}
              aria-pressed={!thumbnailUrl}
              className="flex aspect-video items-center justify-center rounded-md border border-border p-1 text-center text-xs text-muted-foreground aria-pressed:border-accent aria-pressed:bg-muted"
            >
              Default
            </button>
            {images.map((file) => (
              <button
                key={file.url}
                type="button"
                onClick={() => setThumbnailUrl(file.url)}
                aria-pressed={thumbnailUrl === file.url}
                aria-label={file.name}
                className="relative aspect-video overflow-hidden rounded-md border border-border aria-pressed:border-accent aria-pressed:ring-2 aria-pressed:ring-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
