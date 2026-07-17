"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { getJob } from "@/modules/api/rest/ai"
import type { JobView } from "@/modules/api/rest/ai/types"

/** Poll cadence while a job is still PENDING/RUNNING (design §1: ~2.5s). */
export const AI_JOB_POLL_INTERVAL_MS = 2500

/**
 * How long a still-running job may poll before we surface a `isStale` flag so the
 * page can offer a manual retry / "still working…" affordance. Polling does NOT
 * stop when stale — the BE may still finish; stale only drives UI copy.
 */
export const AI_JOB_STALE_MS = 90_000

/**
 * Terminal job states (mirrors BE `AiJobStatus`: PENDING, RUNNING, COMPLETED,
 * FAILED, CANCELLED). Polling stops on any of these; the rest (PENDING/RUNNING)
 * keep the poll alive.
 */
export const isTerminalJobStatus = (status: string | undefined): boolean =>
    status === "COMPLETED" || status === "FAILED" || status === "CANCELLED"

/**
 * Parses `JobView.result` — a JSON string for structured tools (summary /
 * flashcards / quiz), or plain markdown for the debug review. Returns the parsed
 * object when it is valid JSON, otherwise the raw string (so a markdown result is
 * handed through untouched). `undefined` when there is no result yet.
 */
const parseJobResult = <TResult>(raw: string | undefined): TResult | undefined => {
    if (raw === undefined || raw === null || raw === "") return undefined
    try {
        return JSON.parse(raw) as TResult
    } catch {
        return raw as unknown as TResult
    }
}

/** Return shape of {@link useAiJobPolling}. */
export interface UseAiJobPollingReturn<TResult> {
    /** Latest raw job envelope (undefined until the first poll resolves). */
    job: JobView | undefined
    /** Current job status, or undefined before the first poll. */
    status: string | undefined
    /** Parsed `result` once COMPLETED (JSON → object, else raw markdown string). */
    result: TResult | undefined
    /** True while the job is still PENDING/RUNNING (poll active). */
    isRunning: boolean
    /** True once the job reached COMPLETED. */
    isComplete: boolean
    /** True once the job reached FAILED or CANCELLED. */
    isFailed: boolean
    /** True after {@link AI_JOB_STALE_MS} elapsed without a terminal status. */
    isStale: boolean
    /** A fetch/network error from polling `GET /ai/jobs/{id}` (not a job FAILED result). */
    error: Error | undefined
    /** True before the first poll resolves. */
    isLoading: boolean
    /** Revalidate now (manual retry of the poll). */
    refresh: () => void
}

/**
 * Shared poller for async AI jobs. Give it a `jobId` (from a job submit that now
 * returns a JobRef thanks to the `code:1002` envelope fix) and it re-fetches
 * `GET /ai/jobs/{id}` every {@link AI_JOB_POLL_INTERVAL_MS} until the job reaches a
 * terminal status, then stops. Pass `null`/`undefined` (no job submitted yet) to
 * issue no request.
 *
 * `TResult` types the parsed `result` payload for the calling tool page.
 *
 * @param jobId - the JobRef id to poll, or null/undefined to stay idle.
 */
export const useAiJobPolling = <TResult = unknown>(
    jobId: string | null | undefined,
): UseAiJobPollingReturn<TResult> => {
    const swr = useSWR<JobView, Error>(
        jobId ? ["GET_AI_JOB", jobId] : null,
        () => getJob(jobId as string),
        {
            // Dynamic cadence: poll while active, stop (0) the moment a poll returns a
            // terminal status. Mirrors the payment-await poller (useGetOrderSwr).
            refreshInterval: (latest) =>
                isTerminalJobStatus(latest?.status) ? 0 : AI_JOB_POLL_INTERVAL_MS,
            refreshWhenHidden: false,
        },
    )

    const status = swr.data?.status
    const isComplete = status === "COMPLETED"
    const isFailed = status === "FAILED" || status === "CANCELLED"
    const isRunning = jobId != null && !isTerminalJobStatus(status)

    // Stale timer: arm a 90s timeout whenever a (new) job starts running; clear it on
    // a terminal status, a job-id change, or unmount. Keyed on jobId so switching jobs
    // resets the clock. isStale never forces polling to stop — it only drives copy.
    const [isStale, setIsStale] = useState(false)
    const jobIdRef = useRef(jobId)
    if (jobIdRef.current !== jobId) {
        // Reset synchronously on a job change so a stale flag from the previous job
        // does not leak into the new one's first render.
        jobIdRef.current = jobId
        if (isStale) setIsStale(false)
    }
    useEffect(() => {
        if (!jobId) return
        if (isTerminalJobStatus(status)) return
        const timer = setTimeout(() => setIsStale(true), AI_JOB_STALE_MS)
        return () => clearTimeout(timer)
    }, [jobId, status])

    const result = useMemo(
        () => (isComplete ? parseJobResult<TResult>(swr.data?.result) : undefined),
        [isComplete, swr.data?.result],
    )

    return {
        job: swr.data,
        status,
        result,
        isRunning,
        isComplete,
        isFailed,
        isStale: isStale && !isTerminalJobStatus(status),
        error: swr.error,
        isLoading: swr.isLoading,
        refresh: () => {
            void swr.mutate()
        },
    }
}
