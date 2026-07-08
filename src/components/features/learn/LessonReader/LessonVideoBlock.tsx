"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js"
import useSWR from "swr"
import { Card, CardContent, Skeleton } from "@heroui/react"
import { getLessonStreamUrl } from "@/modules/api/rest/course"

/**
 * HLS video player for a lesson, backed by the signed stream endpoint
 * (`GET /courses/lessons/{id}/stream`). Only mounted by the reader when the
 * lesson's `videoStatus === "READY"`. Self-hides when the stream is not
 * accessible (no video / access denied) — the reader's paywall covers gating.
 */
export const LessonVideoBlock = ({ lessonId }: { lessonId: string }) => {
    const { data, error } = useSWR(
        lessonId ? ["lesson-stream", lessonId] : null,
        () => getLessonStreamUrl(lessonId),
        { shouldRetryOnError: false },
    )
    const videoRef = useRef<HTMLVideoElement>(null)
    const url = data?.url

    useEffect(() => {
        const video = videoRef.current
        if (!video || !url) return
        if (Hls.isSupported()) {
            const hls = new Hls({ maxBufferLength: 30, backBufferLength: 10 })
            hls.loadSource(url)
            hls.attachMedia(video)
            return () => {
                hls.destroy()
            }
        }
        // Safari / iOS play HLS natively.
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url
        }
        return
    }, [url])

    // No accessible video for this viewer → render nothing.
    if (error) return null

    return (
        <div className="mx-auto w-full max-w-3xl">
            <Card>
                <CardContent className="p-0">
                    {url ? (
                        <video
                            ref={videoRef}
                            controls
                            playsInline
                            className="aspect-video w-full rounded-2xl bg-black"
                        />
                    ) : (
                        <Skeleton className="aspect-video w-full rounded-2xl" />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
