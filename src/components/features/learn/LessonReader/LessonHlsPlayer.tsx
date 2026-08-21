"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Card, CardContent, Typography } from "@heroui/react"
import { ArrowClockwiseIcon, VideoCameraSlashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import Hls from "hls.js"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useWatchPositionReporter } from "./hooks/useWatchPositionReporter"
import {
    getHlsStartupBufferPlan,
    HLS_STARTUP_CONFIG,
} from "./hlsStartupBuffer"
import {
    getHlsErrorStatus,
    getHlsUrlTokenExpiryMs,
    prepareHlsVodManifestSource,
} from "./hlsVodManifest"

/** A successful HTTP fragment that never reaches media metadata is an append/startup stall. */
const HLS_STARTUP_STALL_TIMEOUT_MS = 8000

/** Refresh grants before a slow first segment can cross their expiry boundary. */
const HLS_TOKEN_REFRESH_LEAD_MS = 2 * 60 * 1000

/** Avoid an infinite detach/attach loop on a genuinely invalid media stream. */
const HLS_STARTUP_RECOVERY_LIMIT = 2

/**
 * HLS player for internal (non-YouTube) lessons.
 *
 * The ONE source is `manifestUrl`: the manifest the BE signed for this viewer
 * (`StreamViewResponse.url` from `GET /courses/lessons/{id}/stream`), loaded straight into
 * hls.js / native HLS.
 *
 * <b>Removed on purpose — the legacy `videoRef` token mode.</b> It resolved an internal
 * `video_*` token against the OLD gateway (`stream.ftes.vn/api/videos/{ref}/playlist`) from
 * the browser, which handed back a Bunny/Wasabi URL with NO expiry, gated only by
 * `Referer`. That is precisely what the per-segment signing on the BE path exists to
 * prevent: one copied URL streams the whole lesson to anyone, forever. It also fired on
 * lessons the BE was already serving properly, because the catalog `videoRef` reaches the
 * FE before the `/stream` call answers.
 *
 * `manifestUrl` null/undefined = the BE has no playable URL for this lesson (a legacy video
 * whose ticket could not be issued, a transcode not READY yet). The player then shows its
 * error card, whose retry re-asks the BE via `onRefreshSource` — it never reaches for the
 * gateway. The paywall is enforced upstream either way: the BE only signs a manifest the
 * viewer is allowed to watch, and cuts the preview window server-side.
 *
 * In PREVIEW mode the player hard-pauses at `previewSeconds`, clamps seeking before
 * the limit, and reports playback to the shared preview gate owned by the parent
 * `LessonVideoBlock` (single source of truth for both the HLS and YouTube players).
 */
export const LessonHlsPlayer = ({
    manifestUrl,
    lessonId,
    previewSeconds,
    isGated,
    onTimeUpdate,
    onEnded,
    onHalfWatched,
    onRefreshSource,
    overlay,
}: {
    /**
     * Signed HLS manifest URL from the BE (`StreamViewResponse.url`) — the only source this
     * player accepts. Null/undefined when the BE could not hand out a playable URL, which
     * renders the error card + retry instead.
     */
    manifestUrl?: string | null
    lessonId: string
    previewSeconds?: number
    /** Preview limit reached — hard-pause the media. From the shared preview gate. */
    isGated: boolean
    /**
     * Report the current playback time to the parent (shared preview gate + up-next).
     * `duration` is the media length when known (`<video>.duration` once metadata is in,
     * `undefined` while it is still `NaN`/`Infinity`) — the up-next window needs it to
     * know how much is left; the preview gate ignores it.
     */
    onTimeUpdate: (currentTime: number, duration?: number) => void
    /** Media ended — the preview manifest may run out of segments. */
    onEnded: () => void
    onHalfWatched?: () => void
    /**
     * Re-fetch a freshly signed `stream.url`. Signed playback expires (grant TTL ~15'), so
     * retrying by replaying the same stale prop just fails again. Retry calls this (wired to
     * the stream SWR `mutate`) so a new signed URL arrives as a new `manifestUrl` prop.
     */
    onRefreshSource?: () => Promise<unknown> | void
    /**
     * Node rendered INSIDE the player frame (the "up next" hand-off card). It must live in
     * here, not in the parent block, so it stays on top of the video rather than beside it.
     */
    overlay?: React.ReactNode
}) => {
    const t = useTranslations("learn")
    const videoEl = useRef<HTMLVideoElement>(null)
    const [failed, setFailed] = useState(false)
    const [loading, setLoading] = useState(true)
    const [attempt, setAttempt] = useState(0)
    const halfFiredRef = useRef(false)
    const resumePositionRef = useRef(0)
    const refreshHistoryRef = useRef<Array<number>>([])
    const resumeLessonRef = useRef(lessonId)
    if (resumeLessonRef.current !== lessonId) {
        resumeLessonRef.current = lessonId
        resumePositionRef.current = 0
        refreshHistoryRef.current = []
    }
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
     * card) remounts, and bumps `attempt` so the load effect re-runs even when the BE hands
     * back the SAME url. The stale signed URL may simply have expired, so also ask the parent
     * for a freshly signed one — it arrives as a new `manifestUrl` prop.
     */
    const handleRetry = () => {
        setFailed(false)
        refreshHistoryRef.current = []
        setAttempt((a) => a + 1)
        void onRefreshSource?.()
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
        resumePositionRef.current = el.currentTime
        const duration = el.duration
        // Only hand up a REAL duration: it is NaN before `loadedmetadata` and Infinity on a
        // live manifest, and the up-next window must not arm on either.
        onTimeUpdate(el.currentTime, Number.isFinite(duration) && duration > 0 ? duration : undefined)

        if (halfFiredRef.current) return
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
        // No URL from the BE = nothing playable. Show the error card (whose retry re-asks the
        // BE) instead of reaching for the old stream gateway from the browser.
        if (!manifestUrl) {
            setFailed(true)
            setLoading(false)
            return
        }
        const el = videoEl.current
        if (!el) return
        let hls: Hls | null = null
        let cancelled = false
        let usingNativeHls = false
        let mediaReady = el.readyState >= 1
        let startupComplete = false
        let startupRecoveryCount = 0
        let startupWatchdog: ReturnType<typeof setTimeout> | null = null
        let disposePreparedSource: (() => void) | null = null
        let tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null
        let sourceRefreshRequested = false
        const sourceController = new AbortController()
        setFailed(false)
        setLoading(true)
        halfFiredRef.current = false

        const clearStartupWatchdog = () => {
            if (startupWatchdog) {
                clearTimeout(startupWatchdog)
                startupWatchdog = null
            }
        }

        const clearTokenRefreshTimer = () => {
            if (tokenRefreshTimer) {
                clearTimeout(tokenRefreshTimer)
                tokenRefreshTimer = null
            }
        }

        const finishStartup = () => {
            if (cancelled || startupComplete) return
            startupComplete = true
            clearStartupWatchdog()
            setLoading(false)
        }

        const maybeFinishStartup = () => {
            if (usingNativeHls) {
                if (mediaReady) finishStartup()
                return
            }
            // Do not hide a playable first segment behind a five-fragment startup gate.
            // hls.js continues filling the 60-second forward buffer in the background.
            if (mediaReady) finishStartup()
        }

        const failStartup = () => {
            if (cancelled) return
            clearStartupWatchdog()
            setFailed(true)
            setLoading(false)
        }

        const requestFreshSource = async () => {
            if (cancelled || sourceRefreshRequested) return
            if (!manifestUrl || !onRefreshSource) {
                failStartup()
                return
            }
            const now = Date.now()
            refreshHistoryRef.current = refreshHistoryRef.current.filter(
                (requestedAt) => now - requestedAt < 60_000,
            )
            if (refreshHistoryRef.current.length >= 2) {
                failStartup()
                return
            }

            sourceRefreshRequested = true
            refreshHistoryRef.current.push(now)
            resumePositionRef.current = el.currentTime
            try {
                await onRefreshSource()
                // If the API returned the same manifest URL, force a no-cache re-read.
                if (!cancelled) setAttempt((value) => value + 1)
            } catch {
                failStartup()
            }
        }

        const recoverStartup = () => {
            if (!hls || cancelled) return
            if (startupRecoveryCount >= HLS_STARTUP_RECOVERY_LIMIT) {
                failStartup()
                return
            }

            startupRecoveryCount += 1
            if (!startupComplete) {
                mediaReady = false
            }
            hls.recoverMediaError()
            hls.startLoad(startupComplete ? -1 : resumePositionRef.current)
        }

        const armStartupWatchdog = () => {
            if (startupComplete || cancelled) return
            clearStartupWatchdog()
            startupWatchdog = setTimeout(() => {
                // A segment response arrived but Chrome still has HAVE_NOTHING: rebuild the
                // MediaSource attachment instead of leaving a permanent grey 0:00 player.
                if (el.readyState < 1) {
                    recoverStartup()
                }
            }, HLS_STARTUP_STALL_TIMEOUT_MS)
        }

        const onMediaReady = () => {
            mediaReady = true
            maybeFinishStartup()
        }

        const play = async () => {
            try {
                const src = manifestUrl
                if (cancelled) return
                // Prefer MediaSource on browsers that support hls.js. Recent desktop
                // Chromium builds can report `maybe` for native HLS, then fetch only the
                // first MPEG-TS fragment and remain at HAVE_NOTHING forever. Safari/iOS
                // has no hls.js MediaSource support and therefore still falls through to
                // the native branch below.
                if (Hls.isSupported()) {
                    const preparedSource = await prepareHlsVodManifestSource(
                        src,
                        sourceController.signal,
                    )
                    if (cancelled) {
                        preparedSource.dispose()
                        return
                    }
                    disposePreparedSource = preparedSource.dispose
                    if (
                        preparedSource.expiresAtMs !== null
                        && preparedSource.expiresAtMs <= Date.now() + HLS_TOKEN_REFRESH_LEAD_MS
                    ) {
                        preparedSource.dispose()
                        disposePreparedSource = null
                        await requestFreshSource()
                        return
                    }
                    if (preparedSource.expiresAtMs !== null) {
                        tokenRefreshTimer = setTimeout(() => {
                            void requestFreshSource()
                        }, Math.max(
                            0,
                            preparedSource.expiresAtMs - Date.now() - HLS_TOKEN_REFRESH_LEAD_MS,
                        ))
                    }
                    hls = new Hls(HLS_STARTUP_CONFIG)
                    hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
                        const plan = getHlsStartupBufferPlan(data.details)
                        hls!.config.maxBufferLength = Math.max(
                            hls!.config.maxBufferLength,
                            plan.bufferSeconds,
                        )
                        hls!.config.maxMaxBufferLength = Math.max(
                            hls!.config.maxMaxBufferLength,
                            plan.bufferSeconds * 2,
                        )
                    })
                    hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
                        if (data.frag.type === "main" && typeof data.frag.sn === "number") {
                            armStartupWatchdog()
                        }
                    })
                    hls.on(Hls.Events.FRAG_BUFFERED, (_event, data) => {
                        if (data.frag.type !== "main" || typeof data.frag.sn !== "number") return
                        maybeFinishStartup()
                    })
                    hls.on(Hls.Events.ERROR, (_e, d) => {
                        if (cancelled) return

                        const responseCode = getHlsErrorStatus(d)
                        const tokenExpiry = d.frag ? getHlsUrlTokenExpiryMs(d.frag.url) : null
                        const authorizationExpired = responseCode === 401
                            || responseCode === 403
                            || (tokenExpiry !== null && tokenExpiry <= Date.now())
                        if (
                            d.type === Hls.ErrorTypes.NETWORK_ERROR
                            && manifestUrl
                            && authorizationExpired
                        ) {
                            void requestFreshSource()
                            return
                        }
                        if (!d.fatal) return

                        if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            if (startupRecoveryCount < HLS_STARTUP_RECOVERY_LIMIT) {
                                startupRecoveryCount += 1
                                hls?.startLoad(startupComplete ? -1 : resumePositionRef.current)
                            } else {
                                failStartup()
                            }
                        } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            recoverStartup()
                        } else {
                            failStartup()
                        }
                    })
                    // Use the same proven ordering as ftes.vn. MediaSource is ready before
                    // the manifest can trigger fragment loading, avoiding the grey 0:00 state.
                    hls.attachMedia(el)
                    hls.loadSource(preparedSource.url)
                } else if (el.canPlayType("application/vnd.apple.mpegurl")) {
                    usingNativeHls = true
                    el.src = src
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
        el.addEventListener("loadedmetadata", onMediaReady)
        el.addEventListener("canplay", onMediaReady)
        void play()

        return () => {
            cancelled = true
            clearStartupWatchdog()
            clearTokenRefreshTimer()
            sourceController.abort()
            disposePreparedSource?.()
            el.removeEventListener("loadedmetadata", onMediaReady)
            el.removeEventListener("canplay", onMediaReady)
            hls?.destroy()
        }
    }, [manifestUrl, attempt])

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

    // Khung đen bo tròn là lớp DUY NHẤT (không Card bọc ngoài) — bề ngang do parent giới hạn.
    return (
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
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPlay={reporter.onPlaying}
                onPause={handlePause}
                onSeeking={clampSeek}
                onSeeked={handleSeeked}
                className="aspect-video w-full rounded-2xl bg-black"
            />
            {loading ? <Skeleton className="absolute inset-0 size-full rounded-2xl" /> : null}
            {/* Up-next card — inside the frame so it sits ON the video. Note: this player
                keeps the NATIVE fullscreen control, which fullscreens the <video> element
                itself, so the card is (unavoidably) hidden while the learner is fullscreen
                here — unlike the YouTube branch, which fullscreens this container. */}
            {overlay}
        </div>
    )
}
