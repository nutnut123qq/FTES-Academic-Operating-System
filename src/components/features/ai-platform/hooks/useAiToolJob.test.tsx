import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RestError } from "@/modules/api/rest/client"

/**
 * Unit — {@link useAiToolJob} + {@link isQuotaError} (`ai-hub-live-tools` tasks
 * 3.4/3.5): the per-page job orchestrator. `useAiJobPolling` is mocked to a
 * controllable poll object so the tests pin THIS hook's own contract:
 *  - `isQuotaError` recognises HTTP 429 and any `*QUOTA*` domain code on a
 *    RestError (and nothing else),
 *  - a successful submit stores the JobRef's jobId (arming the poll),
 *  - a rejected submit surfaces `submitError` (+ `isQuota` for a quota
 *    rejection) and leaves no jobId,
 *  - a re-submit clears the previous error, `reset` returns to the empty form,
 *  - `isBusy` covers both the submit window and a still-running poll.
 */

let pollState: {
    isRunning: boolean
}

vi.mock("./useAiJobPolling", () => ({
    useAiJobPolling: (jobId: string | null) => ({
        job: undefined,
        status: undefined,
        result: undefined,
        isRunning: jobId != null && pollState.isRunning,
        isComplete: false,
        isFailed: false,
        isStale: false,
        error: undefined,
        isLoading: false,
        refresh: vi.fn(),
    }),
}))

import { isQuotaError, useAiToolJob } from "./useAiToolJob"

beforeEach(() => {
    pollState = { isRunning: false }
})

describe("isQuotaError", () => {
    it("recognises an HTTP 429 RestError", () => {
        expect(isQuotaError(new RestError("Too many", 429))).toBe(true)
    })

    it("recognises a *QUOTA* domain code on any status", () => {
        expect(isQuotaError(new RestError("x", 400, "AI_QUOTA_EXCEEDED"))).toBe(true)
        expect(isQuotaError(new RestError("x", 403, "quota_reached"))).toBe(true)
    })

    it("rejects other RestErrors and non-RestErrors", () => {
        expect(isQuotaError(new RestError("boom", 500))).toBe(false)
        expect(isQuotaError(new RestError("forbidden", 403, "COURSE_FORBIDDEN"))).toBe(false)
        expect(isQuotaError(new Error("quota"))).toBe(false)
        expect(isQuotaError(undefined)).toBe(false)
    })
})

describe("useAiToolJob", () => {
    it("stores the jobId from a successful submit", async () => {
        const { result } = renderHook(() => useAiToolJob())
        await act(async () => {
            await result.current.run(async () => ({ jobId: "job-9", status: "PENDING" }))
        })
        expect(result.current.jobId).toBe("job-9")
        expect(result.current.submitError).toBeUndefined()
        expect(result.current.isSubmitting).toBe(false)
    })

    it("surfaces a submit rejection as submitError (no jobId) and flags quota", async () => {
        const { result } = renderHook(() => useAiToolJob())
        await act(async () => {
            await result.current.run(async () => {
                throw new RestError("Quota exceeded", 429, "AI_QUOTA_EXCEEDED")
            })
        })
        expect(result.current.jobId).toBeNull()
        expect(result.current.submitError?.message).toBe("Quota exceeded")
        expect(result.current.isQuota).toBe(true)
        expect(result.current.isBusy).toBe(false)
    })

    it("clears the previous error on a fresh submit", async () => {
        const { result } = renderHook(() => useAiToolJob())
        await act(async () => {
            await result.current.run(async () => {
                throw new Error("network down")
            })
        })
        expect(result.current.submitError).toBeDefined()
        expect(result.current.isQuota).toBe(false)

        await act(async () => {
            await result.current.run(async () => ({ jobId: "job-2", status: "PENDING" }))
        })
        expect(result.current.submitError).toBeUndefined()
        expect(result.current.jobId).toBe("job-2")
    })

    it("reset returns to the empty form", async () => {
        const { result } = renderHook(() => useAiToolJob())
        await act(async () => {
            await result.current.run(async () => ({ jobId: "job-3", status: "PENDING" }))
        })
        act(() => {
            result.current.reset()
        })
        expect(result.current.jobId).toBeNull()
        expect(result.current.submitError).toBeUndefined()
        expect(result.current.isBusy).toBe(false)
    })

    it("isBusy while the submitted job is still running", async () => {
        pollState.isRunning = true
        const { result } = renderHook(() => useAiToolJob())
        expect(result.current.isBusy).toBe(false) // no job yet → poll idle
        await act(async () => {
            await result.current.run(async () => ({ jobId: "job-4", status: "PENDING" }))
        })
        expect(result.current.isBusy).toBe(true)
    })
})
