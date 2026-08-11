import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    UP_NEXT_COUNTDOWN_SECONDS,
    useLessonUpNext,
    type LessonUpNextDestination,
} from "./useLessonUpNext"

/**
 * Unit — `useLessonUpNext`, the "xem hết video tự chuyển sang bài khác" decision logic
 * shared by both lesson players. Timers are faked so the post-`ended` countdown can be
 * driven deterministically. What this pins:
 *  - the button arms only inside the last 10s of a long-enough clip,
 *  - a freemium PREVIEW / gated player never arms and never auto-advances (its video is
 *    cut off early — "ended" there is the paywall, not the finish line),
 *  - no destination → completely inert,
 *  - dismissing kills BOTH the button and the pending auto-advance,
 *  - seeking backwards disarms,
 *  - the navigation happens exactly once, even on a double `ended`.
 */

const nextLesson: LessonUpNextDestination = {
    href: "/courses/khoa-a/learn/content/modules/m1/contents/l2",
    title: "Bài 2",
    kind: "lesson",
}

/**
 * Run the whole countdown. Each second must be advanced in its OWN `act` — the ticker
 * re-schedules itself from an effect, so React has to re-render between ticks or the
 * next timer is never armed.
 */
const runCountdown = () => {
    for (let tick = 0; tick <= UP_NEXT_COUNTDOWN_SECONDS; tick += 1) {
        act(() => {
            vi.advanceTimersByTime(1000)
        })
    }
}

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

describe("useLessonUpNext — arming window", () => {
    it("arms inside the last 10 seconds of a long clip", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.onTimeUpdate(100, 600))
        expect(result.current.isArmed).toBe(false)

        act(() => result.current.onTimeUpdate(591, 600))
        expect(result.current.isArmed).toBe(true)
        expect(result.current.countdown).toBeNull()
    })

    it("disarms when the learner seeks back out of the window", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.onTimeUpdate(595, 600))
        expect(result.current.isArmed).toBe(true)

        // Scrubbed back to the middle → no longer "about to end".
        act(() => result.current.onTimeUpdate(120, 600))
        expect(result.current.isArmed).toBe(false)
    })

    it("never arms on a short clip (duration at/below the threshold)", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        // A 12s clip is "in its last 10s" almost from the start — that must not count.
        act(() => result.current.onTimeUpdate(3, 12))
        expect(result.current.isArmed).toBe(false)
        act(() => result.current.onTimeUpdate(11.5, 12))
        expect(result.current.isArmed).toBe(false)
    })

    it("never arms while the duration is still unknown", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.onTimeUpdate(30))
        expect(result.current.isArmed).toBe(false)
    })
})

describe("useLessonUpNext — inert cases", () => {
    it("does NOT arm or auto-advance in preview/gated mode", () => {
        // A PREVIEW video ENDS EARLY at previewSeconds — that is the paywall, not the end
        // of the lesson, so neither the button nor the hand-off may happen.
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({
                destination: nextLesson,
                disabled: true,
                onNavigate,
                resetKey: "l1",
            }),
        )

        act(() => result.current.onTimeUpdate(115, 120))
        expect(result.current.isArmed).toBe(false)

        act(() => result.current.onEnded())
        expect(result.current.countdown).toBeNull()
        runCountdown()
        expect(onNavigate).not.toHaveBeenCalled()
    })

    it("takes the button down when the stream resolves to PREVIEW mid-playback", () => {
        // `disabled` arrives from the stream SWR, i.e. AFTER mount — a button already on
        // screen must come down without waiting for the next tick.
        const onNavigate = vi.fn()
        const { result, rerender } = renderHook(
            ({ disabled }: { disabled: boolean }) =>
                useLessonUpNext({ destination: nextLesson, disabled, onNavigate, resetKey: "l1" }),
            { initialProps: { disabled: false } },
        )

        act(() => result.current.onTimeUpdate(595, 600))
        expect(result.current.isArmed).toBe(true)

        rerender({ disabled: true })
        expect(result.current.isArmed).toBe(false)
    })

    it("does nothing when there is no destination (last lesson, no challenge)", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: null, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.onTimeUpdate(595, 600))
        expect(result.current.isArmed).toBe(false)

        act(() => result.current.onEnded())
        runCountdown()
        expect(onNavigate).not.toHaveBeenCalled()
    })
})

describe("useLessonUpNext — auto-advance", () => {
    it("counts down after `ended` and navigates exactly once", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.onTimeUpdate(598, 600))
        act(() => result.current.onEnded())
        expect(result.current.countdown).toBe(UP_NEXT_COUNTDOWN_SECONDS)
        expect(result.current.isArmed).toBe(true)
        expect(onNavigate).not.toHaveBeenCalled()

        runCountdown()
        expect(onNavigate).toHaveBeenCalledTimes(1)
        expect(onNavigate).toHaveBeenCalledWith(nextLesson.href)
    })

    it("survives a double `ended` (pause→ended pair / StrictMode) without double-navigating", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.onEnded())
        act(() => result.current.onEnded())
        runCountdown()
        // A second `ended` after the push must not push again either.
        act(() => result.current.onEnded())
        runCountdown()

        expect(onNavigate).toHaveBeenCalledTimes(1)
    })

    it("`go` navigates immediately and only once", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.onTimeUpdate(595, 600))
        act(() => result.current.go())
        act(() => result.current.go())

        expect(onNavigate).toHaveBeenCalledTimes(1)
        expect(onNavigate).toHaveBeenCalledWith(nextLesson.href)
        expect(result.current.isArmed).toBe(false)
    })
})

describe("useLessonUpNext — dismissal", () => {
    it("dismissing hides the button AND cancels the pending auto-advance", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.onTimeUpdate(598, 600))
        act(() => result.current.onEnded())
        expect(result.current.countdown).toBe(UP_NEXT_COUNTDOWN_SECONDS)

        act(() => result.current.dismiss())
        expect(result.current.isArmed).toBe(false)
        expect(result.current.countdown).toBeNull()

        runCountdown()
        expect(onNavigate).not.toHaveBeenCalled()
    })

    it("stays dismissed for the rest of the video (re-watching the ending never re-arms)", () => {
        const onNavigate = vi.fn()
        const { result } = renderHook(() =>
            useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: "l1" }),
        )

        act(() => result.current.dismiss())

        act(() => result.current.onTimeUpdate(597, 600))
        expect(result.current.isArmed).toBe(false)

        act(() => result.current.onEnded())
        runCountdown()
        expect(onNavigate).not.toHaveBeenCalled()
    })

    it("resets the dismissal when the lesson changes", () => {
        const onNavigate = vi.fn()
        const { result, rerender } = renderHook(
            ({ lessonId }: { lessonId: string }) =>
                useLessonUpNext({ destination: nextLesson, onNavigate, resetKey: lessonId }),
            { initialProps: { lessonId: "l1" } },
        )

        act(() => result.current.dismiss())
        rerender({ lessonId: "l2" })

        act(() => result.current.onTimeUpdate(595, 600))
        expect(result.current.isArmed).toBe(true)

        act(() => result.current.onEnded())
        runCountdown()
        expect(onNavigate).toHaveBeenCalledTimes(1)
    })
})
