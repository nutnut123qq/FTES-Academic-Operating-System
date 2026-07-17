import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { usePreviewGate } from "./usePreviewGate"

/**
 * Unit — `usePreviewGate` (learn-preview-player-gate task 4). The shared preview gate
 * owns the countdown, the SINGLE-FIRE package modal, and the once-per-session
 * preview-limit report for both the YouTube and HLS players. The report mutation is
 * mocked so this pins the gate contract without a backend:
 *  - FULL / non-preview streams never gate (report + modal stay silent),
 *  - a PREVIEW stream fires exactly once when playback reaches `previewSeconds`
 *    (modal opens once, limit reported once) and latches `isGated`,
 *  - the report is guarded to once per lesson per session (sessionStorage),
 *  - the countdown re-seeds when the stream resolves `previewSeconds` post-mount.
 */

const trigger = vi.fn(() => Promise.resolve())
vi.mock("@/hooks/swr/api/rest/mutations/usePostReportPreviewLimitSwr", () => ({
    usePostReportPreviewLimitSwr: () => ({ trigger }),
}))

beforeEach(() => {
    trigger.mockClear()
    window.sessionStorage.clear()
})

describe("usePreviewGate", () => {
    it("never gates a FULL (non-preview) stream", () => {
        const onOpenGate = vi.fn()
        const { result } = renderHook(() =>
            usePreviewGate("les-1", "FULL", 0, onOpenGate),
        )

        act(() => result.current.onTimeUpdate(120))

        expect(result.current.isGated).toBe(false)
        expect(onOpenGate).not.toHaveBeenCalled()
        expect(trigger).not.toHaveBeenCalled()
    })

    it("fires the gate exactly once when a PREVIEW reaches the limit", () => {
        const onOpenGate = vi.fn()
        const { result } = renderHook(() =>
            usePreviewGate("les-1", "PREVIEW", 30, onOpenGate),
        )

        // Below the limit → countdown ticks, no gate yet.
        act(() => result.current.onTimeUpdate(10))
        expect(result.current.isGated).toBe(false)
        expect(result.current.timeRemaining).toBe(20)

        // Reaching the limit → gate fires (modal + report), state latches.
        act(() => result.current.onTimeUpdate(30))
        expect(result.current.isGated).toBe(true)
        expect(result.current.timeRemaining).toBe(0)
        expect(onOpenGate).toHaveBeenCalledTimes(1)
        expect(trigger).toHaveBeenCalledTimes(1)
        expect(trigger).toHaveBeenCalledWith({
            lessonId: "les-1",
            request: { watchedSeconds: 30 },
        })

        // Further ticks (e.g. a resume attempt) must NOT re-open the modal or re-report.
        act(() => result.current.onTimeUpdate(31))
        expect(onOpenGate).toHaveBeenCalledTimes(1)
        expect(trigger).toHaveBeenCalledTimes(1)
    })

    it("reports the preview limit only once per lesson per session", () => {
        window.sessionStorage.setItem("ftes.previewLimit.les-1", "1")
        const onOpenGate = vi.fn()
        const { result } = renderHook(() =>
            usePreviewGate("les-1", "PREVIEW", 30, onOpenGate),
        )

        act(() => result.current.onTimeUpdate(30))

        // Modal still opens, but the report is suppressed by the session guard.
        expect(onOpenGate).toHaveBeenCalledTimes(1)
        expect(trigger).not.toHaveBeenCalled()
    })

    it("re-seeds the countdown when previewSeconds resolves after mount", () => {
        const onOpenGate = vi.fn()
        const { result, rerender } = renderHook(
            ({ seconds }: { seconds: number | undefined }) =>
                usePreviewGate("les-1", "PREVIEW", seconds, onOpenGate),
            { initialProps: { seconds: undefined as number | undefined } },
        )

        // Stream not resolved yet → no limit → countdown 0.
        expect(result.current.timeRemaining).toBe(0)

        // Stream resolves previewSeconds → countdown seeds to the full window.
        rerender({ seconds: 45 })
        expect(result.current.timeRemaining).toBe(45)
    })

    it("fires the gate when the preview media ends early", () => {
        const onOpenGate = vi.fn()
        const { result } = renderHook(() =>
            usePreviewGate("les-1", "PREVIEW", 30, onOpenGate),
        )

        act(() => result.current.onEnded())

        expect(result.current.isGated).toBe(true)
        expect(onOpenGate).toHaveBeenCalledTimes(1)
    })
})
