"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/admin/image-upload"
import { clearExperienceVideo, saveExperienceVideo } from "@/app/actions/media"
import { DEFAULT_EXPERIENCE_VIDEO_URL, getYouTubeEmbedUrl, getYouTubeVideoId } from "@/lib/youtube"

type Current = { videoUrl: string; thumbnailUrl: string | null; aspectRatio: number } | null

export function ExperienceVideoManager({ current }: { current: Current }) {
  const router = useRouter()
  const currentVideoUrl = current?.videoUrl ?? ""
  const hasSavedYouTubeVideo = Boolean(getYouTubeVideoId(currentVideoUrl))
  const savedVideoUrl = hasSavedYouTubeVideo ? currentVideoUrl : DEFAULT_EXPERIENCE_VIDEO_URL
  const savedThumbnailUrl = current?.thumbnailUrl ?? null
  const [videoUrl, setVideoUrl] = useState(savedVideoUrl)
  const [publishedVideoUrl, setPublishedVideoUrl] = useState(savedVideoUrl)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(savedThumbnailUrl)
  const [publishedThumbnailUrl, setPublishedThumbnailUrl] = useState<string | null>(savedThumbnailUrl)
  const [hasExplicitSelection, setHasExplicitSelection] = useState(hasSavedYouTubeVideo)
  const [busy, setBusy] = useState<null | "save" | "clear">(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const dirty = videoUrl.trim() !== publishedVideoUrl || thumbnailUrl !== publishedThumbnailUrl
  const previewUrl = getYouTubeEmbedUrl(videoUrl)
  const defaultVideoIsLive = !hasExplicitSelection && publishedVideoUrl === DEFAULT_EXPERIENCE_VIDEO_URL

  async function save() {
    const normalizedUrl = videoUrl.trim()
    if (!getYouTubeVideoId(normalizedUrl)) {
      setError("Enter a valid YouTube video link.")
      return
    }

    setError(null)
    setNotice(null)
    setBusy("save")
    try {
      await saveExperienceVideo({ videoUrl: normalizedUrl, thumbnailUrl, aspectRatio: current?.aspectRatio ?? 16 / 9 })
      setVideoUrl(normalizedUrl)
      setPublishedVideoUrl(normalizedUrl)
      setPublishedThumbnailUrl(thumbnailUrl)
      setHasExplicitSelection(true)
      setNotice("Video settings saved. The video and thumbnail are now shown on the homepage.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the YouTube link.")
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
      setVideoUrl(DEFAULT_EXPERIENCE_VIDEO_URL)
      setPublishedVideoUrl(DEFAULT_EXPERIENCE_VIDEO_URL)
      setThumbnailUrl(null)
      setPublishedThumbnailUrl(null)
      setHasExplicitSelection(false)
      setNotice("Custom selection cleared. The default YouTube video is now shown on the homepage.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restore the default video.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="publish-video-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 id="publish-video-title" className="text-lg font-semibold text-foreground">Publish a YouTube video</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Paste a public or unlisted YouTube link. Customers can play it directly on the homepage without storing the video in Blob.
            </p>
          </div>
          <p className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground" role="status">
            <span className={`size-2 rounded-full ${publishedVideoUrl ? "bg-primary" : "bg-muted-foreground"}`} aria-hidden="true" />
            {defaultVideoIsLive ? "Using default YouTube video" : publishedVideoUrl ? "Live on homepage" : "No video published"}
          </p>
        </div>

        <FieldGroup>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="homepage-youtube-url">YouTube video link</FieldLabel>
            <Input
              id="homepage-youtube-url"
              type="url"
              value={videoUrl}
              placeholder="https://youtu.be/..."
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setVideoUrl(event.target.value)
                setError(null)
                setNotice(null)
              }}
            />
            <FieldDescription>Use a Public or Unlisted YouTube link. Private videos cannot be embedded for customers.</FieldDescription>
            {error && <FieldError>{error}</FieldError>}
          </Field>
        </FieldGroup>
        {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="video-thumbnail-title">
        <div className="flex flex-col gap-1">
          <h2 id="video-thumbnail-title" className="font-semibold text-foreground">Homepage video thumbnail</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Choose the image visitors see before they play the video. Upload a new image or select one from the media library.
          </p>
        </div>
        <ImageUpload
          label="Thumbnail image"
          name="thumbnailUrl"
          value={thumbnailUrl}
          onChange={(value) => {
            setThumbnailUrl(value)
            setError(null)
            setNotice(null)
          }}
          aspect="aspect-video"
          className="w-full max-w-3xl"
          fit="object-cover"
        />
      </section>

      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5" aria-labelledby="video-preview-title">
        <div>
          <h2 id="video-preview-title" className="font-semibold text-foreground">Video preview</h2>
          <p className="text-sm text-muted-foreground">The player is embedded directly on the homepage.</p>
        </div>
        {previewUrl ? (
          <div className="mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-lg bg-foreground">
            <iframe
              src={previewUrl}
              title="YouTube video preview"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-medium text-foreground">Enter a valid YouTube link to preview the video.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy !== null || !dirty} onClick={save} className="gap-2">
            {busy === "save" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
            <span>{busy === "save" ? "Saving…" : "Save video settings"}</span>
          </Button>
          {hasExplicitSelection && (
            <Button type="button" variant="outline" disabled={busy !== null} onClick={clear} className="gap-2 text-destructive">
              {busy === "clear" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
              <span>Restore default video</span>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
