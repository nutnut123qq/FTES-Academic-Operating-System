"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Card, CardContent, Typography } from "@heroui/react"
import { ArrowClockwiseIcon, VideoCameraSlashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import Hls from "hls.js"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { usePreviewGate } from "./hooks/usePreviewGate"
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
 * HLS player for migrated lessons whose `videoRef` is an internal `video_*` token
 * (a minority of Funnycode courses stream from stream.ftes.vn instead of YouTube).
 *
 * Resolves the ref to a signed `master.m3u8` then plays via native HLS (Safari) or
 * hls.js (Chrome/Firefox). The playlist endpoint is unauthenticated, so the paywall
 * is enforced upstream: the BE only ships `videoRef` when the lesson is accessible
 * (free or FULL) — a locked lesson never reaches this component.
 *
 * In PREVIEW mode the player hard-pauses at `previewSeconds`, clamps seeking before
 * the limit, fires the package gate modal, and reports the limit once per session.
 */
export const LessonHlsPlayer = ({
    videoRef,
    lessonId,
    mode,
    previewSeconds,
    onOpenGate,
    onCountdownTick,
    onHalfWatched,
}: {
    videoRef: string
    lessonId: string
    mode?: string
    previewSeconds?: number
    onOpenGate: () => void
    onCountdownTick?: (remaining: number) => void
    onHalfWatched?: () => void
}) => {
    const t = useTranslations("learn")
    const videoEl = useRef<HTMLVideoElement>(null)
    const [failed, setFailed] = useState(false)
    const [loading, setLoading] = useState(true)
    const [attempt, setAttempt] = useState(0)
    const halfFiredRef = useRef(false)
    const halfWatchedRef = useRef(onHalfWatched)
    halfWatchedRef.current = onHalfWatched
    const tickRef = useRef(onCountdownTick)
    tickRef.current = onCountdownTick

    const { isGated, onTimeUpdate, onEnded } = usePreviewGate(
        lessonId,
        mode,
        previewSeconds,
        onOpenGate,
    )

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

    const handleEnded = () => {
        onEnded()
        reporter.onPaused()
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

        const play = async () => {
            try {
                const res = await fetch(
                    `${STREAM_BASE}/api/videos/${encodeURIComponent(videoRef)}/playlist?presign=true`,
                )
                if (!res.ok) throw new Error(`playlist ${res.status}`)
                const data = (await res.json()) as PlaylistResponse
                const src = data.cdnPlaylistUrl ?? data.presignedUrl
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
    }, [videoRef, attempt])

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
                            onPress={() => setAttempt((a) => a + 1)}
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
                    <div className="relative aspect-video w-full">
                        <video
                            ref={videoEl}
                            controls
                            playsInline
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={handleEnded}
                            onPlay={reporter.onPlaying}
                            onPause={reporter.onPaused}
                            onSeeking={clampSeek}
                            onSeeked={handleSeeked}
                            className="aspect-video w-full rounded-2xl"
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
