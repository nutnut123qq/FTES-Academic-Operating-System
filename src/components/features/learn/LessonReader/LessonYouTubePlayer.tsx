"use client"

import { useEffect, useRef, useState } from "react"

/** Minimal shape of the YouTube IFrame Player API surface we use. */
interface YouTubePlayer {
    getCurrentTime?: () => number
    getDuration?: () => number
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

/**
 * Loads the YouTube IFrame Player API exactly once (a shared promise), resolving
 * when `window.YT.Player` is ready. Rejects on script load error / timeout so the
 * caller can fall back to a plain embed rather than hang.
 */
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
 * YouTube lesson player wired for auto-completion. A plain iframe cannot report
 * playback time, so this mounts a real `YT.Player` and polls
 * `getCurrentTime() / getDuration()` once per second while playing; the first time
 * the ratio crosses 50% it calls `onHalfWatched` once and stops polling.
 *
 * If the IFrame API can't load, it degrades to a plain embed (same size wrapper)
 * with no auto-completion rather than crashing.
 */
export const LessonYouTubePlayer = ({
    videoId,
    onHalfWatched,
}: {
    videoId: string
    onHalfWatched?: () => void
}) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const [apiFailed, setApiFailed] = useState(false)
    // Keep the callback in a ref so a new identity never rebuilds the player.
    const halfWatchedRef = useRef(onHalfWatched)
    halfWatchedRef.current = onHalfWatched

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

        loadYouTubeApi()
            .then(() => {
                if (cancelled || !hostRef.current || !window.YT) {
                    return
                }
                // YT replaces the target node with an iframe, so give it a throwaway
                // child (not a React-owned node) to avoid an unmount DOM conflict.
                const target = document.createElement("div")
                target.className = "size-full"
                hostRef.current.appendChild(target)
                player = new window.YT.Player(target, {
                    videoId,
                    width: "100%",
                    height: "100%",
                    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
                    events: {
                        onStateChange: (event) => {
                            if (event.data !== YT_STATE_PLAYING) {
                                clearPoll()
                                return
                            }
                            if (fired || interval) {
                                return
                            }
                            interval = window.setInterval(() => {
                                const duration = player?.getDuration?.() ?? 0
                                const current = player?.getCurrentTime?.() ?? 0
                                if (duration > 0 && current / duration >= 0.5) {
                                    fired = true
                                    clearPoll()
                                    halfWatchedRef.current?.()
                                }
                            }, 1000)
                        },
                    },
                })
            })
            .catch(() => {
                if (!cancelled) {
                    setApiFailed(true)
                }
            })

        return () => {
            cancelled = true
            clearPoll()
            player?.destroy?.()
        }
    }, [videoId])

    if (apiFailed) {
        // Fallback: plain embed, no watch tracking (no auto-complete).
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
