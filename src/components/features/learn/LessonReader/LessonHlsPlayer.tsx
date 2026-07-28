"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Card, CardContent, Typography } from "@heroui/react"
import { ArrowClockwiseIcon, VideoCameraSlashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import Hls from "hls.js"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useWatchPositionReporter } from "./hooks/useWatchPositionReporter"

/** Legacy Funnycode stream gateway that resolves `video_*` refs to an HLS manifest. */
const STREAM_BASE = "https://stream.ftes.vn"

/** Playlist presign response from `GET {STREAM_BASE}/api/videos/{ref}/playlist?presign=true`. */
interface PlaylistResponse {
    cdnPlaylistUrl?: string
    presignedUrl?: string
    proxyPlaylistUrl?: string
}

/**
 * HLS player for internal (non-YouTube) lessons. Two source modes, mutually exclusive:
 *
 * - `manifestUrl` (direct mode): a signed HLS manifest URL the BE already resolved
 *   (`StreamViewResponse.url` when `provider === "HLS"` and `hls_manifest_key` is set).
 *   The URL is loaded STRAIGHT into hls.js / native HLS — no stream-gateway resolve.
 * - `videoRef` (legacy token mode): an internal `video_*` token (a minority of Funnycode
 *   courses stream from stream.ftes.vn). Resolved to a signed `master.m3u8` via the
 *   unauthenticated stream-gateway playlist endpoint, then played.
 *
 * Exactly one of `manifestUrl` / `videoRef` must be provided. Either way the paywall is
 * enforced upstream: the BE only ships a playable URL/ref when the lesson is accessible
 * (free or FULL) — a locked lesson never reaches this component.
 *
 * In PREVIEW mode the player hard-pauses at `previewSeconds`, clamps seeking before
 * the limit, and reports playback to the shared preview gate owned by the parent
 * `LessonVideoBlock` (single source of truth for both the HLS and YouTube players).
 */
export const LessonHlsPlayer = ({
    videoRef,
    manifestUrl,
    lessonId,
    previewSeconds,
    isGated,
    onTimeUpdate,
    onEnded,
    onHalfWatched,
    onRefreshSource,
}: {
    /** Legacy `video_*` token resolved via the stream gateway. Mutually exclusive with `manifestUrl`. */
    videoRef?: string
    /** Pre-signed HLS manifest URL loaded directly (skips the gateway resolve). Mutually exclusive with `videoRef`. */
    manifestUrl?: string
    lessonId: string
    previewSeconds?: number
    /** Preview limit reached — hard-pause the media. From the shared preview gate. */
    isGated: boolean
    /** Report the current playback time to the shared preview gate. */
    onTimeUpdate: (currentTime: number) => void
    /** Media ended — the preview manifest may run out of segments. */
    onEnded: () => void
    onHalfWatched?: () => void
    /**
     * Direct (`manifestUrl`) mode only: re-fetch a freshly signed `stream.url`. A signed
     * master manifest expires (≈6h), so retrying by replaying the same stale prop just
     * fails again. Retry calls this (wired to the stream SWR `mutate`) so a new signed URL
     * arrives as a new `manifestUrl` prop, which re-runs the load effect. Legacy token mode
     * ignores it (it already re-resolves the playlist from the gateway on retry).
     */
    onRefreshSource?: () => void
}) => {
    const t = useTranslations("learn")
    const videoEl = useRef<HTMLVideoElement>(null)
    const [failed, setFailed] = useState(false)
    const [loading, setLoading] = useState(true)
    const [attempt, setAttempt] = useState(0)
    const halfFiredRef = useRef(false)
    const halfWatchedRef = useRef(onHalfWatched)
    halfWatchedRef.current = onHalfWatched

    // Watch-position reporting (resume + analytics) — independent of the 50% mark-complete
    // above. Reads live position from the same <video> element.
    const reporter = useWatchPositionReporter({
        lessonId,
        getSnapshot: () => {
            const el = videoEl.current
            if (!el) return null
            return {
                positionSeconds: el.currentTime,
                durationSeconds: Number.isFinite(el.duration) ? el.duration : null,
            }
        },
    })

    /**
     * Retry after a load failure. Clears `failed` so the <video> (unmounted by the error
     * card) remounts and the load effect can re-attach. In direct manifest mode the stale
     * signed URL may have expired, so fetch a freshly signed one via `onRefreshSource`
     * (the new `manifestUrl` prop re-runs the effect); in legacy token mode bump `attempt`
     * to re-resolve the gateway playlist.
     */
    const handleRetry = () => {
        setFailed(false)
        if (manifestUrl && onRefreshSource) {
            onRefreshSource()
        } else {
            setAttempt((a) => a + 1)
        }
    }

    const clampSeek = () => {
        const el = videoEl.current
        if (!el || !previewSeconds) return
        if (el.currentTime > previewSeconds) {
            el.currentTime = previewSeconds
        }
    }

    const handleTimeUpdate = () => {
        const el = videoEl.current
        if (!el) return

        clampSeek()
        onTimeUpdate(el.currentTime)

        if (halfFiredRef.current) return
        const duration = el.duration
        if (Number.isFinite(duration) && duration > 0 && el.currentTime / duration >= 0.5) {
            halfFiredRef.current = true
            halfWatchedRef.current?.()
        }
    }

    /** Timestamp of the last pause-driven flush — used to dedupe the pause→ended double-flush. */
    const lastPauseFlushRef = useRef(0)

    const handlePause = () => {
        lastPauseFlushRef.current = Date.now()
        reporter.onPaused()
    }

    const handleEnded = () => {
        onEnded()
        // Chrome bắn `pause` ngay trước `ended` ở cuối video → onPause đã flush; chỉ flush lại
        // khi `pause` KHÔNG vừa chạy (trình duyệt spec-compliant không bắn pause lúc ended).
        if (Date.now() - lastPauseFlushRef.current > 500) {
            reporter.onPaused()
        }
    }

    const handleSeeked = () => {
        clampSeek()
        reporter.onSeeked()
    }

    // Hard-pause whenever the gate fires while the video is still mounted.
    useEffect(() => {
        if (isGated) {
            videoEl.current?.pause()
        }
    }, [isGated])

    useEffect(() => {
        const el = videoEl.current
        if (!el) return
        let hls: Hls | null = null
        let cancelled = false
        setFailed(false)
        setLoading(true)
        halfFiredRef.current = false

        const onReady = () => {
            if (!cancelled) setLoading(false)
        }

        // Direct mode uses the pre-signed manifest as-is; token mode resolves it via
        // the stream-gateway playlist endpoint. Everything downstream is identical.
        const resolveSrc = async (): Promise<string | null> => {
            if (manifestUrl) return manifestUrl
            if (!videoRef) return null
            const res = await fetch(
                `${STREAM_BASE}/api/videos/${encodeURIComponent(videoRef)}/playlist?presign=true`,
            )
            if (!res.ok) throw new Error(`playlist ${res.status}`)
            const data = (await res.json()) as PlaylistResponse
            return data.cdnPlaylistUrl ?? data.presignedUrl ?? null
        }

        const play = async () => {
            try {
                const src = await resolveSrc()
                if (!src || cancelled) throw new Error("no playlist url")
                if (el.canPlayType("application/vnd.apple.mpegurl")) {
                    el.addEventListener("loadedmetadata", onReady, { once: true })
                    el.src = src
                } else if (Hls.isSupported()) {
                    hls = new Hls()
                    hls.on(Hls.Events.MANIFEST_PARSED, onReady)
                    hls.on(Hls.Events.ERROR, (_e, d) => {
                        if (d.fatal && !cancelled) {
                            setFailed(true)
                            setLoading(false)
                        }
                    })
                    hls.loadSource(src)
                    hls.attachMedia(el)
                } else if (!cancelled) {
                    setFailed(true)
                    setLoading(false)
                }
            } catch {
                if (!cancelled) {
                    setFailed(true)
                    setLoading(false)
                }
            }
        }
        void play()

        return () => {
            cancelled = true
            el.removeEventListener("loadedmetadata", onReady)
            hls?.destroy()
        }
    }, [videoRef, manifestUrl, attempt])

    if (failed) {
        return (
            <div className="mx-auto w-full max-w-5xl">
                <Card>
                    <CardContent className="flex aspect-video flex-col items-center justify-center gap-3 text-center">
                        <VideoCameraSlashIcon aria-hidden focusable="false" className="size-8 text-muted" />
                        <Typography type="body-sm" color="muted">
                            {t("reader.videoUnavailable")}
                        </Typography>
                        <Button
                            variant="secondary"
                            size="sm"
                            onPress={handleRetry}
                        >
                            <span className="flex items-center gap-1">
                                <ArrowClockwiseIcon aria-hidden focusable="false" className="size-4" />
                                {t("common.retry")}
                            </span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-5xl">
            <Card>
                <CardContent className="p-0">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                        <video
                            ref={videoEl}
                            controls
                            // Self-hosted <video> keeps its OWN native controls fullscreen
                            // button — no custom overlay control (that duplicated the native
                            // one). The custom LessonFullscreenButton stays on the YouTube
                            // player only, where the embed's native fullscreen is disabled.
                            disablePictureInPicture
                            playsInline
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={handleEnded}
                            onPlay={reporter.onPlaying}
                            onPause={handlePause}
                            onSeeking={clampSeek}
                            onSeeked={handleSeeked}
                            className="aspect-video w-full rounded-2xl bg-black"
                        />
                        {loading ? (
                            <Skeleton className="absolute inset-0 size-full rounded-2xl" />
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
