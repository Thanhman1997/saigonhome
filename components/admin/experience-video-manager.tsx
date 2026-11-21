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
  const fallbackVideo = library.find((file) => file.kind === "video")
  const initialHomepageVideo = current ?? (fallbackVideo ? { videoUrl: fallbackVideo.url, thumbnailUrl: null, aspectRatio: 16 / 9 } : null)
  const [videoUrl, setVideoUrl] = useState(initialHomepageVideo?.videoUrl ?? "")
  const [thumbnailUrl, setThumbnailUrl] = useState(initialHomepageVideo?.thumbnailUrl ?? "")
  const [publishedVideoUrl, setPublishedVideoUrl] = useState(initialHomepageVideo?.videoUrl ?? "")
  const [publishedThumbnailUrl, setPublishedThumbnailUrl] = useState(current?.thumbnailUrl ?? "")
  const [hasExplicitSelection, setHasExplicitSelection] = useState(Boolean(current))
  const [ratio, setRatio] = useState(initialHomepageVideo?.aspectRatio ?? 16 / 9)

  const videos = library.filter((file) => file.kind === "video")
  const images = library.filter((file) => file.kind === "image")
  const dirty = videoUrl !== publishedVideoUrl || thumbnailUrl !== publishedThumbnailUrl

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
      setPublishedVideoUrl(url)
      setPublishedThumbnailUrl(thumbnailUrl || "")
      setHasExplicitSelection(true)
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
      setPublishedVideoUrl(videoUrl)
      setPublishedThumbnailUrl(thumbnailUrl)
      setHasExplicitSelection(true)
      setNotice("Published. The homepage now shows this video.")
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
      const fallbackUrl = videos[0]?.url ?? ""
      const fallbackRatio = fallbackUrl ? await probeRatio(fallbackUrl) : 16 / 9
      setVideoUrl(fallbackUrl)
      setThumbnailUrl("")
      setPublishedVideoUrl(fallbackUrl)
      setPublishedThumbnailUrl("")
      setHasExplicitSelection(false)
      setRatio(fallbackRatio)
      setNotice(fallbackUrl ? "Selection cleared. The homepage now uses the latest upload." : "Homepage video cleared.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="publish-video-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 id="publish-video-title" className="text-lg font-semibold text-foreground">Publish a video</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Uploading replaces the featured video on your homepage. If no video is explicitly selected, the homepage uses your latest upload.
            </p>
          </div>
          <p className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground" role="status">
            <span className={`size-2 rounded-full ${publishedVideoUrl ? "bg-primary" : "bg-muted-foreground"}`} aria-hidden="true" />
            {publishedVideoUrl ? (hasExplicitSelection ? "Live on homepage" : "Using latest upload") : "No video published"}
          </p>
        </div>

        <input ref={videoInput} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleVideoFile(file); e.target.value = "" }} />
        <input ref={imageInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImageFile(file); e.target.value = "" }} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" disabled={busy !== null} onClick={() => videoInput.current?.click()} className="gap-2">
            {busy === "video" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
            <span>{busy === "video" ? "Uploading video…" : "Upload & publish video"}</span>
          </Button>
          <p className="text-xs text-muted-foreground">MP4 or WebM, up to 150 MB. Your uploaded file is saved in the video library.</p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
      </section>

      <div className="grid gap-6 @min-[56rem]:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5" aria-labelledby="video-preview-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="video-preview-title" className="font-semibold text-foreground">Video preview</h2>
              <p className="text-sm text-muted-foreground">{videoUrl ? library.find((file) => file.url === videoUrl)?.name ?? "Selected video" : "Select or upload a video to preview it."}</p>
            </div>
            {videoUrl && (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
                {videoUrl === publishedVideoUrl ? (hasExplicitSelection ? "Published" : "Latest upload") : "Not published yet"}
              </span>
            )}
          </div>
          {videoUrl ? (
            <div className="mx-auto w-full overflow-hidden rounded-lg bg-foreground" style={{ aspectRatio: ratio, maxWidth: `calc(60vh * ${ratio})` }}>
              <video key={videoUrl} src={videoUrl} poster={thumbnailUrl || undefined} controls preload="metadata" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
              <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="font-medium text-foreground">No video selected</p>
                <p className="text-sm text-muted-foreground">Use “Upload & publish video” above to add one.</p>
              </div>
            </div>
          )}
          {videoUrl && <p className="text-xs text-muted-foreground">Detected ratio: {ratio.toFixed(2)}:1</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy !== null || !dirty || !videoUrl} onClick={save} className="gap-2">
              {busy === "save" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
              <span>{busy === "save" ? "Publishing…" : "Publish selected video"}</span>
            </Button>
            {hasExplicitSelection && (
              <Button type="button" variant="outline" disabled={busy !== null} onClick={clear} className="gap-2 text-destructive">
                {busy === "clear" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
                Clear homepage selection
              </Button>
            )}
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5" aria-labelledby="video-library-title">
            <div>
              <h2 id="video-library-title" className="font-semibold text-foreground">Video library</h2>
              <p className="text-sm text-muted-foreground">Choose an upload, then publish it to the homepage.</p>
            </div>
            {videos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No uploaded videos yet.</p>
            ) : (
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                {videos.map((file) => (
                  <li key={file.url}>
                    <button
                      type="button"
                      onClick={() => void chooseVideo(file.url)}
                      aria-pressed={videoUrl === file.url}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-3 text-left transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-muted"
                    >
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-sm font-medium text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {file.url === publishedVideoUrl ? (hasExplicitSelection ? "Published" : "Latest upload") : file.url === videoUrl ? "Selected" : "Select"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5" aria-labelledby="video-cover-title">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="video-cover-title" className="font-semibold text-foreground">Cover image</h2>
                <p className="text-sm text-muted-foreground">Shown before playback and again when the video ends.</p>
              </div>
              <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => imageInput.current?.click()} className="gap-2">
                {busy === "image" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ImagePlus data-icon="inline-start" />}
                <span>{busy === "image" ? "Uploading…" : "Upload"}</span>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setThumbnailUrl("")}
                aria-pressed={!thumbnailUrl}
                className="flex aspect-video items-center justify-center rounded-md border border-border p-1 text-center text-xs text-muted-foreground aria-pressed:border-primary aria-pressed:bg-muted"
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
                  className="relative aspect-video overflow-hidden rounded-md border border-border aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
            {thumbnailUrl && <p className="text-xs text-muted-foreground">Cover change will be applied when you publish.</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
