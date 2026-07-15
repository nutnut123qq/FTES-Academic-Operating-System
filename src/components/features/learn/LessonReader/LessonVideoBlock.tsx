"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Card, CardContent, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { useLessonStreamSwr } from "./hooks/useLessonStreamSwr"
import { LessonHlsPlayer } from "./LessonHlsPlayer"
import { LessonYouTubePlayer } from "./LessonYouTubePlayer"

/** Extracts a YouTube video id from a watch / share / embed / shorts URL. */
const youtubeId = (ref: string): string | null => {
    const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/.exec(
        ref,
    )
    return m?.[1] ?? null
}

/** Formats seconds as `mm:ss` for the preview countdown chip. */
const formatCountdown = (seconds: number): string => {
    const s = Math.max(0, Math.round(seconds))
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}:${rem.toString().padStart(2, "0")}`
}

/**
 * Lesson video player with freemium preview support.
 *
 * Resolves the stream manifest to determine `mode`/`previewSeconds`/`cheapestPackage`,
 * then mounts the correct player (HLS for internal `video_*` tokens, YouTube embed
 * otherwise). A countdown chip and a hard pause/seek guard are applied in PREVIEW mode.
 */
export const LessonVideoBlock = ({
    courseId,
    lessonId,
    courseRawId,
    courseTitle,
    lessonTitle,
    packageSlugs,
    videoRef,
    onHalfWatched,
    onPurchased,
}: {
    courseId: string
    lessonId: string
    courseRawId: string
    courseTitle: string
    lessonTitle: string
    packageSlugs: Array<string>
    videoRef: string | null
    onHalfWatched?: () => void
    onPurchased?: () => void
}) => {
    const t = useTranslations("courseSystem.preview")
    const { stream } = useLessonStreamSwr(lessonId)
    const [gateOpen, setGateOpen] = useState(false)
    const [countdown, setCountdown] = useState(stream?.previewSeconds ?? 0)
    const openGate = useCallback(() => setGateOpen(true), [])

    // Keep the countdown chip in sync with the async stream response.
    useEffect(() => {
        if (stream?.previewSeconds != null) {
            setCountdown(stream.previewSeconds)
        }
    }, [stream?.previewSeconds])

    if (!videoRef) return null

    const mode = stream?.mode
    const previewSeconds = stream?.previewSeconds
    const isPreview = mode === "PREVIEW" && previewSeconds && previewSeconds > 0

    const ytId = youtubeId(videoRef)
    const player = ytId ? (
        <LessonYouTubePlayer
            videoId={ytId}
            previewSeconds={previewSeconds}
            onOpenGate={openGate}
            onCountdownTick={setCountdown}
            onHalfWatched={onHalfWatched}
        />
    ) : /^\s*video_/.test(videoRef) ? (
        <LessonHlsPlayer
            videoRef={videoRef.trim()}
            lessonId={lessonId}
            mode={mode}
            previewSeconds={previewSeconds}
            onOpenGate={openGate}
            onCountdownTick={setCountdown}
            onHalfWatched={onHalfWatched}
        />
    ) : null

    if (!player) return null

    return (
        <>
            <div className="relative mx-auto w-full max-w-5xl">
                <Card>
                    <CardContent className="relative p-0">
                        {player}
                        {isPreview ? (
                            <Chip
                                size="sm"
                                color="accent"
                                className="absolute right-3 top-3 z-10 bg-accent text-white"
                            >
                                <span className="flex items-center gap-1">
                                    <Typography type="body-xs" className="text-white">
                                        {t("chip", { time: formatCountdown(countdown) })}
                                    </Typography>
                                </span>
                            </Chip>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
            <PackageGateModal
                isOpen={gateOpen}
                onClose={() => setGateOpen(false)}
                courseId={courseId}
                courseRawId={courseRawId}
                courseTitle={courseTitle}
                lessonId={lessonId}
                lessonTitle={lessonTitle}
                packageSlugs={packageSlugs}
                cheapestPackage={stream?.cheapestPackage}
                context="video"
                onPurchased={onPurchased}
            />
        </>
    )
}
