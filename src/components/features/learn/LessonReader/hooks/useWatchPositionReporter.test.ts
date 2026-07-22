import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Hook — `useWatchPositionReporter` (learn-engagement-wire task 3.3 quality loop).
 *
 * Fake timers (vitest fakes `Date` too, so the 5s wall-clock throttle is
 * deterministic) pin the reporting cadence:
 *  - a 30s interval while playing (`onPlaying` → periodic PUT),
 *  - the 5s throttle collapsing seek bursts,
 *  - pause = terminal flush (bypasses the throttle) + interval stop,
 *  - unmount = fire-and-forget BEACON via the direct REST fn (no SWR trigger),
 *  - nothing sent while the player sits at position 0.
 */

const trigger = vi.fn(() => Promise.resolve({}))
const beacon = vi.fn((_lessonId: string, _request: unknown) => Promise.resolve({}))

vi.mock("@/hooks/swr/api/rest/mutations/usePostReportLessonProgressSwr", () => ({
    usePostReportLessonProgressSwr: () => ({ trigger }),
}))
vi.mock("@/modules/api/rest/course", () => ({
    reportLessonProgress: (lessonId: string, request: unknown) => beacon(lessonId, request),
}))

import { useWatchPositionReporter, type WatchSnapshot } from "./useWatchPositionReporter"

/** Mutable player stub the hook's `getSnapshot` reads from. */
let snapshot: WatchSnapshot | null

const mount = () =>
    renderHook(() =>
        useWatchPositionReporter({ lessonId: "les-1", getSnapshot: () => snapshot }),
    )

beforeEach(() => {
    vi.useFakeTimers()
    trigger.mockClear()
    beacon.mockClear()
    snapshot = { positionSeconds: 0, durationSeconds: 600 }
})

afterEach(() => {
    vi.useRealTimers()
})

describe("useWatchPositionReporter", () => {
    it("PUTs the position every 30s while playing", () => {
        const { result, unmount } = mount()
        act(() => result.current.onPlaying())

        snapshot = { positionSeconds: 10, durationSeconds: 600 }
        act(() => vi.advanceTimersByTime(30_000))
        expect(trigger).toHaveBeenCalledTimes(1)
        expect(trigger).toHaveBeenCalledWith({
            lessonId: "les-1",
            request: { watchedSeconds: 10, videoDurationSeconds: 600 },
        })

        snapshot = { positionSeconds: 40, durationSeconds: 600 }
        act(() => vi.advanceTimersByTime(30_000))
        expect(trigger).toHaveBeenCalledTimes(2)
        expect(trigger).toHaveBeenLastCalledWith({
            lessonId: "les-1",
            request: { watchedSeconds: 40, videoDurationSeconds: 600 },
        })

        unmount()
    })

    it("collapses seek bursts through the 5s throttle", () => {
        const { result, unmount } = mount()

        // First real jump (>5s from the last report) fires.
        snapshot = { positionSeconds: 100, durationSeconds: 600 }
        act(() => result.current.onSeeked())
        expect(trigger).toHaveBeenCalledTimes(1)

        // A second jump right away is a burst — dropped by the throttle.
        snapshot = { positionSeconds: 110, durationSeconds: 600 }
        act(() => result.current.onSeeked())
        expect(trigger).toHaveBeenCalledTimes(1)

        // After the 5s window the same jump reports again.
        act(() => vi.advanceTimersByTime(5_000))
        act(() => result.current.onSeeked())
        expect(trigger).toHaveBeenCalledTimes(2)

        unmount()
    })

    it("ignores a small seek (<5s from the last reported position)", () => {
        const { result, unmount } = mount()

        snapshot = { positionSeconds: 100, durationSeconds: 600 }
        act(() => result.current.onSeeked())
        expect(trigger).toHaveBeenCalledTimes(1)

        // 3s wiggle from the last reported position — not a real jump.
        act(() => vi.advanceTimersByTime(10_000))
        snapshot = { positionSeconds: 103, durationSeconds: 600 }
        act(() => result.current.onSeeked())
        expect(trigger).toHaveBeenCalledTimes(1)

        unmount()
    })

    it("pause flushes immediately (bypassing the throttle) and stops the interval", () => {
        const { result, unmount } = mount()
        act(() => result.current.onPlaying())

        snapshot = { positionSeconds: 10, durationSeconds: 600 }
        act(() => vi.advanceTimersByTime(30_000))
        expect(trigger).toHaveBeenCalledTimes(1)

        // Pause 1s later: inside the 5s window, yet the terminal flush still fires.
        act(() => vi.advanceTimersByTime(1_000))
        snapshot = { positionSeconds: 11, durationSeconds: 600 }
        act(() => result.current.onPaused())
        expect(trigger).toHaveBeenCalledTimes(2)
        expect(trigger).toHaveBeenLastCalledWith({
            lessonId: "les-1",
            request: { watchedSeconds: 11, videoDurationSeconds: 600 },
        })

        // Interval stopped: a full minute passes with no further PUT.
        act(() => vi.advanceTimersByTime(60_000))
        expect(trigger).toHaveBeenCalledTimes(2)

        unmount()
    })

    it("beacons the last position on unmount via the direct REST fn", () => {
        const { unmount } = mount()

        snapshot = { positionSeconds: 25, durationSeconds: 600 }
        unmount()

        // Terminal flush uses the fire-and-forget REST call, NOT the SWR trigger
        // (no setState on an unmounted component).
        expect(trigger).not.toHaveBeenCalled()
        expect(beacon).toHaveBeenCalledTimes(1)
        expect(beacon).toHaveBeenCalledWith("les-1", { watchedSeconds: 25, videoDurationSeconds: 600 })
    })

    it("sends nothing when the player never left position 0", () => {
        const { result, unmount } = mount()
        act(() => result.current.onPlaying())

        snapshot = { positionSeconds: 0, durationSeconds: 600 }
        act(() => vi.advanceTimersByTime(30_000))
        act(() => result.current.onPaused())
        unmount()

        expect(trigger).not.toHaveBeenCalled()
        expect(beacon).not.toHaveBeenCalled()
    })
})
