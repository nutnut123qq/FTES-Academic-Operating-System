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
    withPlaybackAnchor,
} from "./hlsVodManifest"
import type { HlsWindowPolicy } from "./hlsVodManifest"

/** A successful HTTP fragment that never reaches media metadata is an append/startup stall. */
const HLS_STARTUP_STALL_TIMEOUT_MS = 8000

/** Refresh grants before a slow first segment can cross their expiry boundary. */
const HLS_TOKEN_REFRESH_LEAD_MS = 2 * 60 * 1000

/** Avoid an infinite detach/attach loop on a genuinely invalid media stream. */
const HLS_STARTUP_RECOVERY_LIMIT = 2

/**
 * Phần cửa sổ ký được phép dùng hết trước khi trình phát tự neo lại. Tua trong khoảng này thì các
 * segment đã ký sẵn, phát ngay; vượt qua mới cần xin manifest mới. Để sát 1.0 thì người tua chạm
 * 403 trước khi kịp neo; để quá thấp thì neo lại (và khựng) nhiều hơn mức cần.
 */
const ANCHOR_LEAD_USE_RATIO = 0.7

/** Tua LÙI quá ngần này so với mốc neo thì token đoạn đó nhiều khả năng đã hết hạn → neo lại. */
const ANCHOR_REWIND_USE_RATIO = 0.5

/** Chống neo lại liên tục khi người dùng kéo thanh tua qua lại. */
const ANCHOR_MIN_INTERVAL_MS = 2000

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
    /**
     * Mốc (giây) mà manifest hiện tại được ký quanh nó. Stream service ký token theo cửa sổ bám
     * tiến độ xem, nên tua xa = phải xin manifest mới neo tại chỗ vừa tua.
     */
    const [anchorSeconds, setAnchorSeconds] = useState(0)
    const anchorRef = useRef(0)
    const lastAnchorAtRef = useRef(0)
    /** Lúc bấm tạm dừng — để biết đã dừng bao lâu khi phát tiếp. */
    const pausedAtRef = useRef(0)
    /**
     * Đang nạp lại nguồn (neo lại vì tua, hoặc xin vé mới).
     *
     * <b>Đây là chỗ làm hỏng việc tua trên máy thật:</b> lúc nạp lại, `hls.destroy()` tháo media khỏi
     * thẻ `<video>` nên `currentTime` tụt về 0 và trình duyệt bắn `timeupdate`/`seeked`/`pause` với
     * giá trị đó. Không có cờ này thì mốc "quay về chỗ đang xem" bị ghi đè thành 0, `seeked(0)` bị
     * hiểu là người dùng tua về đầu (neo lại lần nữa ở 0), và bộ báo tiến độ PUT vị trí 0 lên BE.
     */
    const reloadingRef = useRef(false)
    const windowPolicyRef = useRef<HlsWindowPolicy | null>(null)
    const halfFiredRef = useRef(false)
    const resumePositionRef = useRef(0)
    const refreshHistoryRef = useRef<Array<number>>([])
    const resumeLessonRef = useRef(lessonId)
    if (resumeLessonRef.current !== lessonId) {
        resumeLessonRef.current = lessonId
        resumePositionRef.current = 0
        refreshHistoryRef.current = []
        anchorRef.current = 0
        windowPolicyRef.current = null
    }
    const halfWatchedRef = useRef(onHalfWatched)
    halfWatchedRef.current = onHalfWatched

    // Watch-position reporting (resume + analytics) — independent of the 50% mark-complete
    // above. Reads live position from the same <video> element.
    const reporter = useWatchPositionReporter({
        lessonId,
        getSnapshot: () => {
            const el = videoEl.current
            // Đang nạp lại thì vị trí trên thẻ <video> là rác của quá trình nạp, không phải chỗ người
            // ta đang xem — báo lên BE là ghi đè tiến độ THẬT bằng số 0.
            if (!el || reloadingRef.current) return null
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

    /**
     * Xin manifest mới được ký quanh `seconds`. Dùng khi người xem TUA ra ngoài cửa sổ đã ký — chủ
     * động neo lại thì chỉ mất một nhịp nạp; đợi CDN trả 403 rồi mới chữa thì người xem thấy video
     * đứng hình trước, và mỗi lần như vậy còn tiêu một lượt trong hạn ngạch chống-tải phía server.
     */
    const reanchor = (seconds: number) => {
        const now = Date.now()
        if (now - lastAnchorAtRef.current < ANCHOR_MIN_INTERVAL_MS) return
        lastAnchorAtRef.current = now
        reloadingRef.current = true
        resumePositionRef.current = seconds
        anchorRef.current = seconds
        setAnchorSeconds(seconds)
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
        if (!reloadingRef.current) {
            resumePositionRef.current = el.currentTime
        }
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
        // `pause` do nạp lại sinh ra không phải người dùng bấm dừng: tính vào đó thì lần phát tiếp
        // sẽ tưởng đã dừng lâu và neo lại thêm một lần nữa.
        if (reloadingRef.current) return
        lastPauseFlushRef.current = Date.now()
        pausedAtRef.current = Date.now()
        reporter.onPaused()
    }

    /**
     * Phát tiếp sau khi tạm dừng LÂU: token của đoạn đang đứng nhiều khả năng đã hết hạn (TTL tính
     * bằng phút). Neo lại ngay lúc bấm play thì người xem mất một nhịp nạp; để nguyên thì họ bấm
     * play, video đứng im, CDN trả 403 rồi mới chữa — chậm hơn và trông như hỏng.
     */
    const handlePlay = () => {
        if (reloadingRef.current) return
        reporter.onPlaying()

        const el = videoEl.current
        const policy = windowPolicyRef.current
        const pausedFor = pausedAtRef.current === 0 ? 0 : Date.now() - pausedAtRef.current
        pausedAtRef.current = 0
        if (!el || !policy) return
        if (pausedFor > policy.ttlSeconds * 1000 * ANCHOR_REWIND_USE_RATIO) {
            reanchor(el.currentTime)
        }
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

        const el = videoEl.current
        if (!el) return
        if (reloadingRef.current) {
            // `seeked` lúc này gần như luôn do chính việc nạp lại (media bị tháo → 0).
            //
            // ⚠️ ĐỪNG dùng `readyState` để phân biệt "người dùng tua tiếp": lúc media vừa bị tháo,
            // `readyState` VẪN có thể > 0 trong một nhịp — tôi đã thử cách đó và nó chính là thứ ghi
            // mốc quay-về thành 0, làm video chạy lại từ đầu. Chỉ nhận khi vị trí mới thực sự nằm
            // trong bài (> 1 giây); ai tua đúng về 0:00 giữa lúc đang nạp thì tua lại một lần nữa.
            if (el.currentTime > 1 && Math.abs(el.currentTime - resumePositionRef.current) > 2) {
                resumePositionRef.current = el.currentTime
                anchorRef.current = el.currentTime
                setAnchorSeconds(el.currentTime)
            }
            return
        }
        reporter.onSeeked()

        const policy = windowPolicyRef.current
        // Server đời cũ không công bố cửa sổ → không có gì để tính; đường 403 vẫn đỡ được.
        if (!policy) return
        const delta = el.currentTime - anchorRef.current
        const tooFarAhead = delta > policy.leadSeconds * ANCHOR_LEAD_USE_RATIO
        const tooFarBehind = delta < -policy.ttlSeconds * ANCHOR_REWIND_USE_RATIO
        if (tooFarAhead || tooFarBehind) {
            reanchor(el.currentTime)
        }
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
            reloadingRef.current = false
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
            reloadingRef.current = true
            // Neo lại tại chỗ đang đứng: nguồn mới phải ký quanh ĐÂY, không phải quanh chỗ cũ —
            // nếu không thì tua xa xong sẽ xin lại đúng một manifest cũng không mở được đoạn đó.
            anchorRef.current = el.currentTime
            lastAnchorAtRef.current = Date.now()
            setAnchorSeconds(el.currentTime)
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

        /**
         * Chỗ phải quay về sau khi nạp lại. Lấy MAX của mốc neo (state, chỉ đổi khi ta chủ động neo)
         * và vị trí đang xem (ref, do sự kiện của thẻ <video> ghi). Ref có thể bị chính việc nạp lại
         * ghi rác về 0 trong một nhịp; state thì không — nên state là chốt chặn cuối.
         */
        const resumeAt = () => Math.max(resumePositionRef.current, anchorSeconds)

        const onMediaReady = () => {
            mediaReady = true
            // Nạp lại xong: đưa về ĐÚNG chỗ đang xem rồi mới mở lại các tín hiệu vị trí.
            // `startPosition` của hls.js đã lo phần lớn ca này, nhưng không phải đường nào cũng có
            // (HLS native), nên kiểm lại tận nơi thay vì tin vào cấu hình.
            if (reloadingRef.current) {
                const resume = resumeAt()
                if (resume > 0 && Math.abs(el.currentTime - resume) > 1) {
                    el.addEventListener("seeked", () => { reloadingRef.current = false }, { once: true })
                    el.currentTime = resume
                } else {
                    reloadingRef.current = false
                }
            }
            maybeFinishStartup()
        }

        const play = async () => {
            try {
                // Mốc đang xem đi kèm URL: stream service ký cửa sổ token quanh đúng chỗ này.
                const src = withPlaybackAnchor(manifestUrl, anchorSeconds)
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
                    windowPolicyRef.current = preparedSource.windowPolicy
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
                    // Nạp lại (neo lại / xin nguồn mới) phải quay về ĐÚNG chỗ đang xem. Thiếu
                    // startPosition thì mỗi lần neo lại là video nhảy về 0:00 — lỗi khó chịu hơn
                    // nhiều so với chính vấn đề đang chữa.
                    hls = new Hls(resumeAt() > 0
                        ? { ...HLS_STARTUP_CONFIG, startPosition: resumeAt() }
                        : HLS_STARTUP_CONFIG)
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
                        // 429 = vé này đã đổi manifest quá số lần cho phép (hạn ngạch chống tải hàng
                        // loạt của stream service). Với người học thật thì cách chữa giống hệt hết
                        // hạn: xin BE cấp vé MỚI. Không xếp 429 vào đây thì một người tua nhiều sẽ
                        // gặp thẻ "video lỗi" giữa bài mà không hiểu vì sao.
                        const authorizationExpired = responseCode === 401
                            || responseCode === 403
                            || responseCode === 429
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
                    // HLS native không có startPosition: tự tua về chỗ cũ khi metadata sẵn sàng.
                    if (resumeAt() > 0) {
                        const resume = resumeAt()
                        el.addEventListener("loadedmetadata", () => {
                            if (!cancelled) el.currentTime = resume
                        }, { once: true })
                    }
                    // HLS native không có startPosition: tự tua về chỗ cũ khi metadata sẵn sàng.
                    if (resumePositionRef.current > 0) {
                        const resume = resumePositionRef.current
                        el.addEventListener("loadedmetadata", () => {
                            if (!cancelled) el.currentTime = resume
                        }, { once: true })
                    }
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
    }, [manifestUrl, anchorSeconds, attempt])

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
                onPlay={handlePlay}
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
