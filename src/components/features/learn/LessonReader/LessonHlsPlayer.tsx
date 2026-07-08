"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@heroui/react"
import Hls from "hls.js"

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
 * (free or FULL) — a locked lesson never reaches this component. Any resolve/CORS
 * failure hides the player (mirrors the YouTube block's self-hide).
 */
export const LessonHlsPlayer = ({ videoRef }: { videoRef: string }) => {
    const videoEl = useRef<HTMLVideoElement>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const el = videoEl.current
        if (!el) return
        let hls: Hls | null = null
        let cancelled = false

        const play = async () => {
            try {
                const res = await fetch(
                    `${STREAM_BASE}/api/videos/${encodeURIComponent(videoRef)}/playlist?presign=true`,
                )
                if (!res.ok) throw new Error(`playlist ${res.status}`)
                const data = (await res.json()) as PlaylistResponse
                const src = data.cdnPlaylistUrl ?? data.presignedUrl
                if (!src || cancelled) throw new Error("no playlist url")
                // Safari plays HLS natively; other browsers need hls.js.
                if (el.canPlayType("application/vnd.apple.mpegurl")) {
                    el.src = src
                } else if (Hls.isSupported()) {
                    hls = new Hls()
                    hls.on(Hls.Events.ERROR, (_e, d) => {
                        if (d.fatal && !cancelled) setFailed(true)
                    })
                    hls.loadSource(src)
                    hls.attachMedia(el)
                } else if (!cancelled) {
                    setFailed(true)
                }
            } catch {
                if (!cancelled) setFailed(true)
            }
        }
        void play()

        return () => {
            cancelled = true
            hls?.destroy()
        }
    }, [videoRef])

    if (failed) return null

    return (
        <div className="mx-auto w-full max-w-3xl">
            <Card>
                <CardContent className="p-0">
                    <video
                        ref={videoEl}
                        controls
                        playsInline
                        className="aspect-video w-full rounded-2xl"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
