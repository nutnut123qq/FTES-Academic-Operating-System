"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { LockSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useWatchPositionReporter } from "./hooks/useWatchPositionReporter"

/** Minimal shape of the YouTube IFrame Player API surface we use. */
interface YouTubePlayer {
    getCurrentTime?: () => number
    getDuration?: () => number
    seekTo?: (seconds: number, allowSeekAhead: boolean) => void
    pauseVideo?: () => void
    destroy?: () => void
}
interface YouTubePlayerStateEvent {
    /** YT.PlayerState.PLAYING === 1. */
    data: number
}
interface YouTubeNamespace {
    Player: new (
        el: HTMLElement,
        options: {
            videoId: string
            width?: string | number
            height?: string | number
            playerVars?: Record<string, string | number>
            events?: {
                onStateChange?: (event: YouTubePlayerStateEvent) => void
                onReady?: () => void
            }
        },
    ) => YouTubePlayer
}

declare global {
    interface Window {
        YT?: YouTubeNamespace
        onYouTubeIframeAPIReady?: () => void
    }
}

/** YT.PlayerState.PLAYING. */
const YT_STATE_PLAYING = 1
/** YT.PlayerState.ENDED. */
const YT_STATE_ENDED = 0
/** YT.PlayerState.PAUSED. */
const YT_STATE_PAUSED = 2

let ytApiPromise: Promise<void> | null = null
const loadYouTubeApi = (): Promise<void> => {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("no window"))
    }
    if (window.YT?.Player) {
        return Promise.resolve()
    }
    if (ytApiPromise) {
        return ytApiPromise
    }
    ytApiPromise = new Promise<void>((resolve, reject) => {
        const prev = window.onYouTubeIframeAPIReady
        const timeout = window.setTimeout(() => reject(new Error("yt api timeout")), 10000)
        window.onYouTubeIframeAPIReady = () => {
            prev?.()
            window.clearTimeout(timeout)
            resolve()
        }
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        tag.async = true
        tag.onerror = () => {
            window.clearTimeout(timeout)
            reject(new Error("yt api load failed"))
        }
        document.head.appendChild(tag)
    })
    return ytApiPromise
}

/**
 * YouTube lesson player wired for auto-completion and freemium preview limits.
 *
 * Polls playback time once per second while playing. The first time the ratio crosses
 * 50% it calls `onHalfWatched`. Each tick reports the current time to the shared
 * preview gate via `onTimeUpdate` (which owns the countdown, single-fire modal, and
 * limit report). The gate is PERSISTENT: once `gated` is true every resume is
 * hard-paused and seeked back to the limit (not a one-shot event), and seeking past
 * the limit is always clamped. When the IFrame API fails to load, a PREVIEW lesson
 * shows an enroll card instead of a bare (ungateable) iframe.
 */
export const LessonYouTubePlayer = ({
    videoId,
    lessonId,
    previewSeconds,
    isPreview,
    gated,
    onTimeUpdate,
    onEnded,
    onOpenGate,
    onHalfWatched,
}: {
    videoId: string
    lessonId: string
    previewSeconds?: number
    isPreview: boolean
    gated: boolean
    /** Report the current playback time to the shared preview gate. */
    onTimeUpdate: (currentTime: number) => void
    /** Media ended — the preview manifest may run out. */
    onEnded?: () => void
    /** Open the package gate modal (used by the API-failure enroll card). */
    onOpenGate: () => void
    onHalfWatched?: () => void
}) => {
    const t = useTranslations("courseSystem.preview")
    const hostRef = useRef<HTMLDivElement>(null)
    const [apiFailed, setApiFailed] = useState(false)
    /** Live player handle so the reporter can read position/duration on demand. */
    const playerRef = useRef<YouTubePlayer | null>(null)
    const reporter = useWatchPositionReporter({
        lessonId,
        getSnapshot: () => {
            const p = playerRef.current
            if (!p?.getCurrentTime) return null
            const duration = p.getDuration?.() ?? 0
            return {
                positionSeconds: p.getCurrentTime(),
                durationSeconds: duration > 0 ? duration : null,
            }
        },
    })
    const reporterRef = useRef(reporter)
    reporterRef.current = reporter
    const halfWatchedRef = useRef(onHalfWatched)
    halfWatchedRef.current = onHalfWatched
    const timeUpdateRef = useRef(onTimeUpdate)
    timeUpdateRef.current = onTimeUpdate
    const endedRef = useRef(onEnded)
    endedRef.current = onEnded
    /** Latest `gated` readable inside the poll/state callbacks without re-creating the player. */
    const gatedRef = useRef(gated)
    gatedRef.current = gated
    const previewLimitRef = useRef(previewSeconds ?? 0)
    previewLimitRef.current = previewSeconds ?? 0

    useEffect(() => {
        let player: YouTubePlayer | null = null
        let interval: number | undefined
        let cancelled = false
        let fired = false

        const clearPoll = () => {
            if (interval) {
                window.clearInterval(interval)
                interval = undefined
            }
        }

        const pauseAt = () => {
            try {
                player?.pauseVideo?.()
            } catch {
                // ignore player errors
            }
        }

        /** Force playback back inside the preview window. */
        const enforceGate = () => {
            pauseAt()
            const limit = previewLimitRef.current
            if (limit > 0) {
                try {
                    player?.seekTo?.(limit, true)
                } catch {
                    // ignore player errors
                }
            }
        }

        const tick = () => {
            const current = player?.getCurrentTime?.() ?? 0
            const duration = player?.getDuration?.() ?? 0
            const limit = previewLimitRef.current

            // Persistent gate: once limit reached, every resume is pushed back.
            if (gatedRef.current) {
                enforceGate()
                return
            }

            // Clamp seeking past the limit BEFORE reporting (fixes the old dead code:
            // the clamp used to sit after `fireGate(); return`, so it never ran).
            if (limit > 0 && current > limit) {
                try {
                    player?.seekTo?.(limit, true)
                } catch {
                    // ignore player errors
                }
            }

            // Countdown + single-fire modal + preview-limit report live in the hook.
            timeUpdateRef.current(current)

            // Reached the limit this tick → pause now (the `gated` state lands next render).
            if (limit > 0 && current >= limit - 0.5) {
                pauseAt()
                return
            }

            // Auto-complete at 50% (FULL playback only — a PREVIEW gates first).
            if (!fired && duration > 0 && current / duration >= 0.5) {
                fired = true
                halfWatchedRef.current?.()
                if (limit <= 0) clearPoll()
            }
        }

        loadYouTubeApi()
            .then(() => {
                if (cancelled || !hostRef.current || !window.YT) {
                    return
                }
                const target = document.createElement("div")
                target.className = "size-full"
                hostRef.current.appendChild(target)
                player = new window.YT.Player(target, {
                    videoId,
                    width: "100%",
                    height: "100%",
                    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
                    events: {
                        onReady: () => {
                            // Clamp / enforce in case the player resumes mid-video.
                            const limit = previewLimitRef.current
                            if (gatedRef.current) {
                                enforceGate()
                            } else if (
                                limit > 0 &&
                                (player?.getCurrentTime?.() ?? 0) > limit
                            ) {
                                try {
                                    player?.seekTo?.(limit, true)
                                } catch {
                                    // ignore player errors
                                }
                            }
                        },
                        onStateChange: (event) => {
                            if (event.data === YT_STATE_PLAYING) {
                                // Playing → start the 30s watch-position cadence.
                                reporterRef.current.onPlaying()
                                // Resuming after the gate is not allowed — push back and
                                // do NOT (re)start the poll.
                                if (gatedRef.current) {
                                    enforceGate()
                                    return
                                }
                                if (fired || interval) {
                                    return
                                }
                                interval = window.setInterval(tick, 1000)
                                return
                            }
                            // Chỉ PAUSED/ENDED mới dừng cadence + flush vị trí. BUFFERING(3)/CUED(5)/
                            // UNSTARTED(-1) — khựng mạng giữa lúc phát — KHÔNG flush để tránh PUT force thừa.
                            if (event.data === YT_STATE_PAUSED || event.data === YT_STATE_ENDED) {
                                clearPoll()
                                reporterRef.current.onPaused()
                                if (event.data === YT_STATE_ENDED) {
                                    endedRef.current?.()
                                }
                            }
                        },
                    },
                })
                playerRef.current = player
            })
            .catch(() => {
                if (!cancelled) {
                    setApiFailed(true)
                }
            })

        return () => {
            cancelled = true
            clearPoll()
            playerRef.current = null
            player?.destroy?.()
        }
    }, [videoId])

    if (apiFailed) {
        // A PREVIEW lesson must never fall back to a bare iframe (it cannot be gated —
        // the user could watch the whole video). Losing the preview is better than
        // leaking the full video: show an enroll card instead. FULL keeps the iframe.
        if (isPreview) {
            return (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-surface px-6 text-center">
                    <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
                    <Typography type="body-sm" color="muted">
                        {t("fallback.body")}
                    </Typography>
                    <Button variant="primary" size="sm" onPress={onOpenGate}>
                        {t("overlay.cta")}
                    </Button>
                </div>
            )
        }
        return (
            <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="Lesson video"
                className="aspect-video w-full rounded-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            />
        )
    }

    return <div ref={hostRef} className="aspect-video w-full overflow-hidden rounded-2xl" />
}
