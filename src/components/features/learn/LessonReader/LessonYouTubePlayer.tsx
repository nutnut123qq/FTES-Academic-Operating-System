"use client"

import React, { useEffect, useRef, useState } from "react"
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
 * 50% it calls `onHalfWatched`. In PREVIEW mode it pauses and opens the package gate
 * when playback reaches `previewSeconds`, and clamps seeking past the limit.
 */
export const LessonYouTubePlayer = ({
    videoId,
    lessonId,
    previewSeconds,
    onOpenGate,
    onCountdownTick,
    onHalfWatched,
}: {
    videoId: string
    lessonId: string
    previewSeconds?: number
    onOpenGate: () => void
    onCountdownTick?: (remaining: number) => void
    onHalfWatched?: () => void
}) => {
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
    const tickRef = useRef(onCountdownTick)
    tickRef.current = onCountdownTick
    const gateFiredRef = useRef(false)
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

        const fireGate = () => {
            if (gateFiredRef.current) return
            gateFiredRef.current = true
            clearPoll()
            try {
                player?.pauseVideo?.()
            } catch {
                // ignore player errors
            }
            onOpenGate()
        }

        const clampSeek = () => {
            const limit = previewLimitRef.current
            if (!limit || !player?.getCurrentTime) return
            const current = player.getCurrentTime()
            if (current > limit) {
                player.seekTo?.(limit, true)
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
                            // Initial seek clamp in case the player resumes mid-video.
                            clampSeek()
                        },
                        onStateChange: (event) => {
                            if (event.data === YT_STATE_PLAYING) {
                                // Playing → start the 30s watch-position cadence.
                                reporterRef.current.onPlaying()
                                if (fired || interval) {
                                    return
                                }
                                interval = window.setInterval(() => {
                                    const duration = player?.getDuration?.() ?? 0
                                    const current = player?.getCurrentTime?.() ?? 0

                                    const limit = previewLimitRef.current
                                    if (limit > 0) {
                                        const remaining = Math.max(0, limit - current)
                                        tickRef.current?.(remaining)
                                        if (current >= limit - 0.5 || remaining <= 0) {
                                            fireGate()
                                            return
                                        }
                                        if (current > limit) {
                                            player?.seekTo?.(limit, true)
                                        }
                                    }

                                    if (duration > 0 && current / duration >= 0.5) {
                                        fired = true
                                        clearPoll()
                                        halfWatchedRef.current?.()
                                    }
                                }, 1000)
                                return
                            }
                            // Chỉ PAUSED/ENDED mới dừng cadence + flush vị trí. BUFFERING(3)/CUED(5)/
                            // UNSTARTED(-1) — khựng mạng giữa lúc phát — KHÔNG flush để tránh PUT force thừa.
                            if (event.data === YT_STATE_PAUSED || event.data === YT_STATE_ENDED) {
                                clearPoll()
                                reporterRef.current.onPaused()
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
    }, [videoId, onOpenGate])

    if (apiFailed) {
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
