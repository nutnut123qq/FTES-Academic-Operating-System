import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { JobView } from "@/modules/api/rest/ai/types"

/**
 * Unit — {@link useAiJobPolling} (`ai-hub-live-tools` tasks 1.2/1.3): the shared
 * poller every job tool page sits on. `swr` is mocked to capture the
 * `(key, fetcher, config)` triple and to serve a controllable `data`, pinning:
 *  - no jobId → null key (no request fired),
 *  - the dynamic `refreshInterval`: 2.5s while PENDING/RUNNING, 0 (stop) the
 *    moment a poll returns COMPLETED/FAILED/CANCELLED,
 *  - the fetcher delegates to `getJob(jobId)`,
 *  - `result` parsing: JSON string → object, bare markdown → raw passthrough,
 *    and no parse before COMPLETED,
 *  - the `isStale` flag arms after 90s of a non-terminal job, never outlives a
 *    terminal status, and resets when the jobId changes.
 */

type SwrCall = {
    key: unknown
    fetcher: (() => unknown) | undefined
    config: Record<string, unknown> | undefined
}

const swrCalls: Array<SwrCall> = []
let swrData: JobView | undefined
const swrMutate = vi.fn()

vi.mock("swr", () => ({
    default: (
        key: unknown,
        fetcher: (() => unknown) | undefined,
        config: Record<string, unknown> | undefined,
    ) => {
        swrCalls.push({ key, fetcher, config })
        return { data: swrData, error: undefined, isLoading: false, mutate: swrMutate }
    },
}))

const getJob = vi.fn()
vi.mock("@/modules/api/rest/ai", () => ({
    getJob: (...a: Array<unknown>) => getJob(...a),
}))

import {
    AI_JOB_POLL_INTERVAL_MS,
    AI_JOB_STALE_MS,
    isTerminalJobStatus,
    useAiJobPolling,
} from "./useAiJobPolling"

const job = (over: Partial<JobView>): JobView => ({
    id: "job-1",
    feature: "SUMMARY" as JobView["feature"],
    status: "RUNNING",
    ...over,
})

const lastCall = () => swrCalls[swrCalls.length - 1]

/** The refreshInterval fn the hook handed to SWR, applied to a given latest JobView. */
const intervalFor = (latest: JobView | undefined): number => {
    const refreshInterval = lastCall().config?.refreshInterval as (
        latest: JobView | undefined,
    ) => number
    return refreshInterval(latest)
}

beforeEach(() => {
    swrCalls.length = 0
    swrData = undefined
    swrMutate.mockReset()
    getJob.mockReset()
})

afterEach(() => {
    vi.useRealTimers()
})

describe("isTerminalJobStatus", () => {
    it("treats COMPLETED/FAILED/CANCELLED as terminal, PENDING/RUNNING/undefined as live", () => {
        expect(isTerminalJobStatus("COMPLETED")).toBe(true)
        expect(isTerminalJobStatus("FAILED")).toBe(true)
        expect(isTerminalJobStatus("CANCELLED")).toBe(true)
        expect(isTerminalJobStatus("PENDING")).toBe(false)
        expect(isTerminalJobStatus("RUNNING")).toBe(false)
        expect(isTerminalJobStatus(undefined)).toBe(false)
    })
})

describe("useAiJobPolling", () => {
    it("stays idle (null key) without a jobId", () => {
        renderHook(() => useAiJobPolling(null))
        expect(lastCall().key).toBeNull()
    })

    it("keys on the job id and delegates the fetcher to getJob", () => {
        renderHook(() => useAiJobPolling("job-1"))
        expect(lastCall().key).toEqual(["GET_AI_JOB", "job-1"])
        lastCall().fetcher?.()
        expect(getJob).toHaveBeenCalledWith("job-1")
    })

    it("polls at 2.5s while PENDING/RUNNING and stops (0) on a terminal status", () => {
        renderHook(() => useAiJobPolling("job-1"))
        expect(intervalFor(undefined)).toBe(AI_JOB_POLL_INTERVAL_MS)
        expect(intervalFor(job({ status: "PENDING" }))).toBe(AI_JOB_POLL_INTERVAL_MS)
        expect(intervalFor(job({ status: "RUNNING" }))).toBe(AI_JOB_POLL_INTERVAL_MS)
        expect(intervalFor(job({ status: "COMPLETED" }))).toBe(0)
        expect(intervalFor(job({ status: "FAILED" }))).toBe(0)
        expect(intervalFor(job({ status: "CANCELLED" }))).toBe(0)
        expect(lastCall().config).toMatchObject({ refreshWhenHidden: false })
    })

    it("parses a JSON result once COMPLETED", () => {
        swrData = job({ status: "COMPLETED", result: "{\"tldr\":\"ngắn gọn\"}" })
        const { result } = renderHook(() =>
            useAiJobPolling<{ tldr: string }>("job-1"),
        )
        expect(result.current.isComplete).toBe(true)
        expect(result.current.isRunning).toBe(false)
        expect(result.current.result).toEqual({ tldr: "ngắn gọn" })
    })

    it("hands a bare markdown result through untouched", () => {
        swrData = job({ status: "COMPLETED", result: "## Review\nlooks fine" })
        const { result } = renderHook(() => useAiJobPolling<string>("job-1"))
        expect(result.current.result).toBe("## Review\nlooks fine")
    })

    it("exposes no result before COMPLETED and flags FAILED/CANCELLED", () => {
        swrData = job({ status: "RUNNING", result: "{\"x\":1}" })
        const running = renderHook(() => useAiJobPolling("job-1"))
        expect(running.result.current.result).toBeUndefined()
        expect(running.result.current.isRunning).toBe(true)

        swrData = job({ status: "FAILED", errorMessage: "boom" })
        const failed = renderHook(() => useAiJobPolling("job-1"))
        expect(failed.result.current.isFailed).toBe(true)
        expect(failed.result.current.isRunning).toBe(false)
    })

    it("arms isStale after 90s of a non-terminal job", () => {
        vi.useFakeTimers()
        swrData = job({ status: "RUNNING" })
        const { result } = renderHook(() => useAiJobPolling("job-1"))
        expect(result.current.isStale).toBe(false)

        act(() => {
            vi.advanceTimersByTime(AI_JOB_STALE_MS - 1)
        })
        expect(result.current.isStale).toBe(false)

        act(() => {
            vi.advanceTimersByTime(1)
        })
        expect(result.current.isStale).toBe(true)
    })

    it("drops isStale the moment the job turns terminal", () => {
        vi.useFakeTimers()
        swrData = job({ status: "RUNNING" })
        const { result, rerender } = renderHook(() => useAiJobPolling("job-1"))
        act(() => {
            vi.advanceTimersByTime(AI_JOB_STALE_MS)
        })
        expect(result.current.isStale).toBe(true)

        swrData = job({ status: "COMPLETED", result: "{}" })
        rerender()
        expect(result.current.isStale).toBe(false)
    })

    it("resets the stale clock when the job id changes", () => {
        vi.useFakeTimers()
        swrData = job({ status: "RUNNING" })
        const { result, rerender } = renderHook(
            ({ id }: { id: string }) => useAiJobPolling(id),
            { initialProps: { id: "job-1" } },
        )
        act(() => {
            vi.advanceTimersByTime(AI_JOB_STALE_MS)
        })
        expect(result.current.isStale).toBe(true)

        rerender({ id: "job-2" })
        expect(result.current.isStale).toBe(false)
    })

    it("refresh() revalidates the poll", () => {
        const { result } = renderHook(() => useAiJobPolling("job-1"))
        result.current.refresh()
        expect(swrMutate).toHaveBeenCalledTimes(1)
    })
})
