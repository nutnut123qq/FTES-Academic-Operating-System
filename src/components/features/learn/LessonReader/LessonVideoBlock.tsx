"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Card, CardContent, Chip, Typography } from "@heroui/react"
import { LockSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useLessonStreamSwr } from "./hooks/useLessonStreamSwr"
import { usePreviewGate } from "./hooks/usePreviewGate"
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
 * Full-cover lock shown once the preview limit is hit and the package modal has been
 * dismissed. Blurs the video and BLOCKS pointer events to the iframe/video beneath
 * (no `pointer-events-none`), so a locked YouTube embed can no longer be clicked to
 * resume. The CTA re-opens the package gate modal (premium-unlock = enroll the course).
 */
const PreviewLockOverlay = ({
    title,
    body,
    cta,
    onReopen,
}: {
    title: string
    body: string | null
    cta: string
    onReopen: () => void
}) => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface/85 px-6 text-center backdrop-blur-sm">
        <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
        <Typography type="body" className="font-semibold text-foreground">
            {title}
        </Typography>
        {body ? (
            <Typography type="body-sm" color="muted">
                {body}
            </Typography>
        ) : null}
        <Button variant="primary" size="sm" onPress={onReopen}>
            {cta}
        </Button>
    </div>
)

/**
 * Lesson video player with freemium preview support.
 *
 * Resolves the stream manifest to determine `mode`/`previewSeconds`/`cheapestPackage`
 * (and, on the `freemium-youtube-preview-gate` BE, a PREVIEW `videoRef`), then mounts
 * the correct player (HLS for internal `video_*` tokens, YouTube embed otherwise).
 *
 * The preview gate is a PERSISTENT state owned here (single source of truth): the
 * shared `usePreviewGate` hook fires once at `previewSeconds` → opens the package modal
 * and flips `gated`; while `gated`, every player resume is hard-paused/seeked back, and
 * once the modal is dismissed a full-cover lock overlay replaces interaction with the
 * video. Buying the course flips `mode` to FULL and clears the gate.
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
    const { stream, isLoading } = useLessonStreamSwr(lessonId)
    const [gateOpen, setGateOpen] = useState(false)
    /** Persistent "preview limit reached" state — drives the lock overlay + player pause. */
    const [gated, setGated] = useState(false)

    const mode = stream?.mode
    const previewSeconds = stream?.previewSeconds

    // Reaching the preview limit = pause + auto-open the package modal AND latch `gated`
    // so the overlay/pause survive the user dismissing the modal.
    const openGate = useCallback(() => {
        setGated(true)
        setGateOpen(true)
    }, [])

    const previewGate = usePreviewGate(lessonId, mode, previewSeconds, openGate)

    // Purchase completed (stream mutates to FULL) → drop the gate, play the full video.
    useEffect(() => {
        if (mode === "FULL") setGated(false)
    }, [mode])

    // Catalog ref (free/FULL) wins; PREVIEW YouTube arrives via the stream response.
    const effectiveRef = videoRef ?? stream?.videoRef ?? null

    if (!effectiveRef) {
        // No catalog ref yet: the stream may still supply a PREVIEW ref — hold an
        // aspect-video skeleton instead of collapsing layout. Once the stream has
        // resolved without a ref, render nothing (unchanged behaviour on old BE).
        if (!videoRef && isLoading) {
            return (
                <div className="mx-auto w-full max-w-5xl">
                    <Skeleton className="aspect-video w-full rounded-2xl" />
                </div>
            )
        }
        return null
    }

    const isPreview = mode === "PREVIEW" && !!previewSeconds && previewSeconds > 0

    const ytId = youtubeId(effectiveRef)
    const player = ytId ? (
        <LessonYouTubePlayer
            videoId={ytId}
            lessonId={lessonId}
            previewSeconds={previewSeconds}
            isPreview={isPreview}
            gated={gated}
            onTimeUpdate={previewGate.onTimeUpdate}
            onEnded={previewGate.onEnded}
            onOpenGate={() => setGateOpen(true)}
            onHalfWatched={onHalfWatched}
        />
    ) : /^\s*video_/.test(effectiveRef) ? (
        <LessonHlsPlayer
            videoRef={effectiveRef.trim()}
            lessonId={lessonId}
            previewSeconds={previewSeconds}
            isGated={previewGate.isGated}
            onTimeUpdate={previewGate.onTimeUpdate}
            onEnded={previewGate.onEnded}
            onHalfWatched={onHalfWatched}
        />
    ) : null

    if (!player) return null

    const cheapestName = stream?.cheapestPackage?.name
    const overlayBody = cheapestName ? t("overlay.body", { name: cheapestName }) : null

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
                                        {t("chip", { time: formatCountdown(previewGate.timeRemaining) })}
                                    </Typography>
                                </span>
                            </Chip>
                        ) : null}
                        {gated && !gateOpen ? (
                            <PreviewLockOverlay
                                title={t("overlay.title")}
                                body={overlayBody}
                                cta={t("overlay.cta")}
                                onReopen={() => setGateOpen(true)}
                            />
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
