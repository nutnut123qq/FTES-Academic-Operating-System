"use client"

import { useCallback, useRef, useState } from "react"
import { usePostReportPreviewLimitSwr } from "@/hooks/swr/api/rest/mutations/usePostReportPreviewLimitSwr"

/** Preview gate state exposed by {@link usePreviewGate}. */
export interface UsePreviewGateResult {
    /** Seconds left in the preview window (0 once the gate has fired). */
    timeRemaining: number
    /** Whether the preview limit has been reached and the gate should be shown. */
    isGated: boolean
    /** Call on each playback `timeupdate` with the current time in seconds. */
    onTimeUpdate: (currentTime: number) => void
    /** Call when the media ends (the preview manifest may run out of segments). */
    onEnded: () => void
}

/** Build the sessionStorage key used to report the preview limit once per lesson per session. */
const previewLimitKey = (lessonId: string) => `ftes.previewLimit.${lessonId}`

/**
 * Manages the video preview countdown, hard pause/seek guard, and one-per-session
 * reporting for a PREVIEW-mode lesson stream.
 */
export const usePreviewGate = (
    lessonId: string | undefined,
    mode: string | undefined,
    previewSeconds: number | undefined,
    onOpenGate: () => void,
): UsePreviewGateResult => {
    const limit = previewSeconds ?? 0
    const isPreview = mode === "PREVIEW" && limit > 0
    const [timeRemaining, setTimeRemaining] = useState(limit)
    const [isGated, setIsGated] = useState(false)
    const gateFiredRef = useRef(false)
    const reportLimit = usePostReportPreviewLimitSwr()

    const reportOnce = useCallback(() => {
        if (!lessonId || typeof window === "undefined") return
        const key = previewLimitKey(lessonId)
        if (window.sessionStorage.getItem(key)) return
        window.sessionStorage.setItem(key, "1")
        void reportLimit.trigger({ lessonId, request: { watchedSeconds: limit } })
    }, [lessonId, limit, reportLimit])

    const fireGate = useCallback(() => {
        if (gateFiredRef.current) return
        gateFiredRef.current = true
        setIsGated(true)
        setTimeRemaining(0)
        reportOnce()
        onOpenGate()
    }, [onOpenGate, reportOnce])

    const onTimeUpdate = useCallback((currentTime: number) => {
        if (!isPreview) return
        const remaining = Math.max(0, limit - currentTime)
        setTimeRemaining(remaining)
        if (currentTime >= limit - 0.5 || remaining <= 0) {
            fireGate()
        }
    }, [isPreview, limit, fireGate])

    const onEnded = useCallback(() => {
        if (!isPreview) return
        fireGate()
    }, [isPreview, fireGate])

    return { timeRemaining, isGated, onTimeUpdate, onEnded }
}
