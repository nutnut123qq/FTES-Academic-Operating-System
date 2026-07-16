"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { reportLessonProgress } from "@/modules/api/rest/course"
import { usePostReportLessonProgressSwr } from "@/hooks/swr/api/rest/mutations/usePostReportLessonProgressSwr"

/** How often (ms) to PUT the watch position while the video is actively playing. */
const REPORT_INTERVAL_MS = 30_000
/** Throttle floor (ms): never fire two progress PUTs closer than this. */
const REPORT_THROTTLE_MS = 5_000
/** Minimum seek delta (s) that counts as a "real" seek worth flushing. */
const SEEK_FLUSH_DELTA_SECONDS = 5

/** A point-in-time reading of the video element / player. */
export interface WatchSnapshot {
    /** Current playback position, seconds. */
    positionSeconds: number
    /** Total media duration, seconds — `null` when not yet known. */
    durationSeconds: number | null
}

/**
 * Reports the learner's video watch position to
 * `PUT /courses/lessons/{id}/progress` for resume + analytics.
 *
 * Cadence:
 *  - a 30s interval while the video is playing (started via `onPlaying`, stopped via
 *    `onPaused`),
 *  - an immediate flush on pause, on a large seek (> 5s jump), when the tab is hidden
 *    (`visibilitychange`), and on unmount / route change (cleanup),
 *  - all guarded by a 5s throttle so bursts (seek storms, quick pause/play) collapse to
 *    at most one PUT per 5s — except terminal flushes (pause / hide / unmount), which
 *    bypass the throttle so the resume point is never lost.
 *
 * This is deliberately ORTHOGONAL to the existing "complete at 50%" flow: the BE
 * auto-completes a lesson from these reports at its own threshold (≥90%), while the FE
 * keeps firing its own 50% mark-complete. Both are idempotent and coexist — this hook
 * NEVER calls mark-complete.
 *
 * @param lessonId    lesson whose progress is reported.
 * @param getSnapshot ref-stable getter returning the live position/duration, or `null`
 *                    when the player isn't ready. The player owns the source of truth.
 */
export const useWatchPositionReporter = ({
    lessonId,
    getSnapshot,
}: {
    lessonId: string
    getSnapshot: () => WatchSnapshot | null
}) => {
    const { trigger } = usePostReportLessonProgressSwr()

    // Keep the latest getter/trigger/lessonId in refs so the interval + window handlers
    // installed once (on mount) always read current values without re-subscribing.
    const snapshotRef = useRef(getSnapshot)
    snapshotRef.current = getSnapshot
    const triggerRef = useRef(trigger)
    triggerRef.current = trigger
    const lessonIdRef = useRef(lessonId)
    lessonIdRef.current = lessonId

    const intervalRef = useRef<number | null>(null)
    /** Wall-clock ms of the last PUT — throttle anchor. */
    const lastSentAtRef = useRef(0)
    /** Last position we reported — used to size seek jumps. */
    const lastPositionRef = useRef(0)

    /**
     * Build the request body, or `null` when there's nothing meaningful to report
     * (player not ready, or still at position 0 — no resume value in that).
     */
    const buildRequest = useCallback(() => {
        const snap = snapshotRef.current()
        if (!snap) {
            return null
        }
        const watched = Math.floor(snap.positionSeconds)
        if (!Number.isFinite(watched) || watched <= 0) {
            return null
        }
        const duration =
            snap.durationSeconds != null && Number.isFinite(snap.durationSeconds) && snap.durationSeconds > 0
                ? Math.round(snap.durationSeconds)
                : null
        return { watched, request: { watchedSeconds: watched, videoDurationSeconds: duration } }
    }, [])

    /**
     * Send a progress PUT.
     *
     * @param force when `true`, bypasses the 5s throttle (terminal flushes: pause / tab
     *              hide / unmount). Otherwise a report < 5s after the previous one is
     *              dropped.
     * @param beacon when `true`, uses a direct fire-and-forget REST call instead of the
     *               SWR trigger — safe to call from an unmount cleanup (no state update
     *               on an unmounted component).
     */
    const report = useCallback(
        (force: boolean, beacon: boolean) => {
            const built = buildRequest()
            if (!built) {
                return
            }
            const now = Date.now()
            if (!force && now - lastSentAtRef.current < REPORT_THROTTLE_MS) {
                return
            }
            lastSentAtRef.current = now
            lastPositionRef.current = built.watched
            if (beacon) {
                // Fire-and-forget: the component is (or is about to be) unmounted.
                void reportLessonProgress(lessonIdRef.current, built.request).catch(() => {})
                return
            }
            void triggerRef.current({ lessonId: lessonIdRef.current, request: built.request }).catch(() => {})
        },
        [buildRequest],
    )

    const stopInterval = useCallback(() => {
        if (intervalRef.current != null) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    /** Video started playing → begin the 30s cadence (idempotent). */
    const onPlaying = useCallback(() => {
        if (intervalRef.current != null) {
            return
        }
        intervalRef.current = window.setInterval(() => {
            report(false, false)
        }, REPORT_INTERVAL_MS)
    }, [report])

    /** Video paused / ended → stop the cadence and flush the current position. */
    const onPaused = useCallback(() => {
        stopInterval()
        report(true, false)
    }, [stopInterval, report])

    /** A seek happened → flush only when it's a real jump (> 5s from last report). */
    const onSeeked = useCallback(() => {
        const snap = snapshotRef.current()
        if (!snap) {
            return
        }
        if (Math.abs(Math.floor(snap.positionSeconds) - lastPositionRef.current) >= SEEK_FLUSH_DELTA_SECONDS) {
            report(false, false)
        }
    }, [report])

    // One-time window wiring: flush when the tab is hidden, and flush + stop on unmount.
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "hidden") {
                report(true, true)
            }
        }
        document.addEventListener("visibilitychange", onVisibility)
        return () => {
            document.removeEventListener("visibilitychange", onVisibility)
            stopInterval()
            // Unmount / route change: beacon the last position so resume is accurate.
            report(true, true)
        }
    }, [report, stopInterval])

    return useMemo(() => ({ onPlaying, onPaused, onSeeked }), [onPlaying, onPaused, onSeeked])
}
