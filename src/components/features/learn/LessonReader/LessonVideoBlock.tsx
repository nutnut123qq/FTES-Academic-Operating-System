"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { LockSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRouter } from "@/i18n/navigation"
import { useLessonStreamSwr } from "./hooks/useLessonStreamSwr"
import { usePreviewGate } from "./hooks/usePreviewGate"
import { useLessonUpNext } from "./hooks/useLessonUpNext"
import type { LessonUpNextDestination } from "./hooks/useLessonUpNext"
import { LessonHlsPlayer } from "./LessonHlsPlayer"
import { LessonUpNextOverlay } from "./LessonUpNextOverlay"
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
 * the correct player. Dispatch order: a signed HLS manifest (`provider === "HLS"`,
 * `stream.url` set, `videoRef` null) plays DIRECTLY via {@link LessonHlsPlayer}'s
 * `manifestUrl` mode; otherwise the ref-based fallback runs — YouTube embed for a
 * YouTube ref, HLS token mode for an internal `video_*` ref.
 *
 * The preview gate is a PERSISTENT state owned here (single source of truth): the
 * shared `usePreviewGate` hook fires once at `previewSeconds` → opens the package modal
 * and flips `gated`; while `gated`, every player resume is hard-paused/seeked back, and
 * once the modal is dismissed a full-cover lock overlay replaces interaction with the
 * video. Buying the course flips `mode` to FULL and clears the gate.
 *
 * It also owns the "up next" wiring: it feeds both players' time/ended callbacks into
 * {@link useLessonUpNext} and renders the resulting overlay INSIDE the player frame. The
 * gate and up-next are mutually exclusive by construction — a PREVIEW/gated video is cut
 * off early, so its `ended` means "the free window ran out", never "finished the lesson",
 * and `upNextDisabled` reads exactly the same signals the gate does.
 */
export const LessonVideoBlock = ({
    courseId,
    lessonId,
    courseRawId,
    courseTitle,
    courseCoverUrl,
    lessonTitle,
    packageSlugs,
    videoRef,
    upNext = null,
    onHalfWatched,
    onPurchased,
}: {
    courseId: string
    lessonId: string
    courseRawId: string
    courseTitle: string
    /** Course cover art — branded into the preview-ended package gate; empty → lock-icon fallback. */
    courseCoverUrl?: string
    lessonTitle: string
    packageSlugs: Array<string>
    videoRef: string | null
    /**
     * Where finishing this video hands off to (this lesson's challenge, else the next
     * lesson) — resolved by the reader, which already owns the prev/next pager. Null =
     * nowhere to go, so no button and no auto-advance.
     */
    upNext?: LessonUpNextDestination | null
    onHalfWatched?: () => void
    onPurchased?: () => void
}) => {
    const t = useTranslations("courseSystem.preview")
    const router = useRouter()
    const { stream, isLoading, mutate: refreshStream } = useLessonStreamSwr(lessonId)
    const [gateOpen, setGateOpen] = useState(false)
    /** Persistent "preview limit reached" state — drives the lock overlay + player pause. */
    const [gated, setGated] = useState(false)

    const mode = stream?.mode
    const previewSeconds = stream?.previewSeconds
    /**
     * A PREVIEW stream with a real window: this video is CUT OFF at `previewSeconds`, so
     * reaching its end is the paywall, not the finish line. Same predicate `usePreviewGate`
     * uses internally, so the up-next gate can never disagree with the preview gate.
     */
    const isPreview = mode === "PREVIEW" && !!previewSeconds && previewSeconds > 0

    // Reaching the preview limit = pause + auto-open the package modal AND latch `gated`
    // so the overlay/pause survive the user dismissing the modal.
    const openGate = useCallback(() => {
        setGated(true)
        setGateOpen(true)
    }, [])

    const previewGate = usePreviewGate(lessonId, mode, previewSeconds, openGate)

    /** No hand-off from a preview / already-gated video — see the component doc. */
    const upNextDisabled = isPreview || gated || previewGate.isGated
    const goToUpNext = useCallback((href: string) => router.push(href), [router])
    const upNextState = useLessonUpNext({
        destination: upNext,
        disabled: upNextDisabled,
        onNavigate: goToUpNext,
        resetKey: lessonId,
    })

    // One handler pair feeds BOTH consumers, so the two players stay identical wiring-wise.
    const { onTimeUpdate: reportPreviewTime, onEnded: reportPreviewEnded } = previewGate
    const { onTimeUpdate: reportUpNextTime, onEnded: reportUpNextEnded } = upNextState
    const handleTimeUpdate = useCallback((currentTime: number, duration?: number) => {
        reportPreviewTime(currentTime)
        reportUpNextTime(currentTime, duration)
    }, [reportPreviewTime, reportUpNextTime])
    const handleEnded = useCallback(() => {
        reportPreviewEnded()
        reportUpNextEnded()
    }, [reportPreviewEnded, reportUpNextEnded])

    // Purchase completed (stream mutates to FULL) → drop the gate, play the full video.
    useEffect(() => {
        if (mode === "FULL") setGated(false)
    }, [mode])

    // Signed HLS manifest: a real `hls_manifest_key` lesson → the BE ships
    // `provider === "HLS"` + `stream.url` (a signed master.m3u8) with `videoRef` null.
    // Play it DIRECTLY, ahead of any ref-based dispatch.
    const manifestUrl = stream?.provider === "HLS" && stream.url ? stream.url : null

    // Catalog ref (free/FULL) wins; PREVIEW YouTube arrives via the stream response.
    const effectiveRef = videoRef ?? stream?.videoRef ?? null

    if (!manifestUrl && !effectiveRef) {
        // No manifest and no catalog ref yet: the stream may still supply a PREVIEW ref —
        // hold an aspect-video skeleton instead of collapsing layout. Once the stream has
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

    // Rendered INSIDE whichever player mounts (never in the wrapper below), so it stays on
    // top of the video and survives the YouTube branch's container fullscreen.
    const upNextOverlay = upNext && upNextState.isArmed ? (
        <LessonUpNextOverlay
            destination={upNext}
            countdown={upNextState.countdown}
            onGo={upNextState.go}
            onDismiss={upNextState.dismiss}
        />
    ) : null

    const ytId = effectiveRef ? youtubeId(effectiveRef) : null
    const player = manifestUrl ? (
        <LessonHlsPlayer
            manifestUrl={manifestUrl}
            lessonId={lessonId}
            previewSeconds={previewSeconds}
            isGated={previewGate.isGated}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onHalfWatched={onHalfWatched}
            // Direct signed-manifest mode: a retry after expiry re-signs the stream URL
            // (fetches a fresh stream.url) instead of replaying the stale manifest prop.
            onRefreshSource={() => { void refreshStream() }}
            overlay={upNextOverlay}
        />
    ) : ytId ? (
        <LessonYouTubePlayer
            videoId={ytId}
            lessonId={lessonId}
            previewSeconds={previewSeconds}
            isPreview={isPreview}
            gated={gated}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onOpenGate={() => setGateOpen(true)}
            onHalfWatched={onHalfWatched}
            // The last-10s window sits past the ≥50% mark where the poll would otherwise stop.
            trackToEnd={!!upNext && !upNextDisabled}
            overlay={upNextOverlay}
        />
    ) : effectiveRef && /^\s*video_/.test(effectiveRef) ? (
        <LessonHlsPlayer
            videoRef={effectiveRef.trim()}
            lessonId={lessonId}
            previewSeconds={previewSeconds}
            isGated={previewGate.isGated}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onHalfWatched={onHalfWatched}
            overlay={upNextOverlay}
        />
    ) : null

    if (!player) return null

    const cheapestName = stream?.cheapestPackage?.name
    const overlayBody = cheapestName ? t("overlay.body", { name: cheapestName }) : null

    return (
        <>
            {/* Không bọc Card: player tự có khung đen bo tròn — 1 lớp viền duy nhất. */}
            <div className="relative mx-auto w-full max-w-5xl">
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
            </div>
            <PackageGateModal
                isOpen={gateOpen}
                onClose={() => setGateOpen(false)}
                courseId={courseId}
                courseRawId={courseRawId}
                courseTitle={courseTitle}
                courseCoverUrl={courseCoverUrl}
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
