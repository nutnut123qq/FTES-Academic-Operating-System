"use client"

import { useCallback, useState } from "react"
import { RestError } from "@/modules/api/rest/client"
import type { JobRef } from "@/modules/api/rest/ai/types"
import { useAiJobPolling, type UseAiJobPollingReturn } from "./useAiJobPolling"

/**
 * Detects a quota-exhausted rejection so a tool page can show a quota-specific
 * message (design §4: "quota 429 → message riêng") instead of a generic failure.
 * The BE rejects an over-quota submit with HTTP 429 and/or a `*QUOTA*` domain
 * error code — either signal counts.
 *
 * @param error - The error thrown by a job submit (or undefined).
 */
export const isQuotaError = (error: unknown): boolean => {
    if (!(error instanceof RestError)) return false
    if (error.status === 429) return true
    return /QUOTA/i.test(error.errorCode ?? "")
}

/** Return shape of {@link useAiToolJob}. */
export interface UseAiToolJobReturn<TResult> {
    /**
     * Submit a job. Pass a factory that performs the matching `submit*Job` call
     * and resolves to its {@link JobRef}; the hook stores the returned `jobId` and
     * starts polling. A second submit resets the previous job/result first.
     */
    run: (submit: () => Promise<JobRef>) => Promise<void>
    /** Clear the current job, result, and any submit error (back to the empty form). */
    reset: () => void
    /** True while the submit request itself is in flight (before a jobId exists). */
    isSubmitting: boolean
    /** A submit error (network / envelope), or undefined. Distinct from a job that ran and FAILED. */
    submitError: Error | undefined
    /** True when {@link submitError} is a quota-exhausted rejection. */
    isQuota: boolean
    /** The accepted job id, or null before a successful submit. */
    jobId: string | null
    /** The live poll of `GET /ai/jobs/{id}` for the current job. */
    poll: UseAiJobPollingReturn<TResult>
    /**
     * True whenever the tool is busy — submitting OR a submitted job is still
     * PENDING/RUNNING. Drives the single "generating…" state.
     */
    isBusy: boolean
}

/**
 * Orchestrates one async AI tool job end-to-end: submit → hold the `jobId` →
 * poll via {@link useAiJobPolling} → expose result / failure / quota / stale.
 * Shared by the four job tool pages (summary / flashcards / quiz / debug) so each
 * page only owns its form and its per-type result renderer.
 *
 * `TResult` types the parsed job result for the calling page.
 */
export const useAiToolJob = <TResult = unknown>(): UseAiToolJobReturn<TResult> => {
    const [jobId, setJobId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<Error | undefined>(undefined)

    const poll = useAiJobPolling<TResult>(jobId)

    const reset = useCallback(() => {
        setJobId(null)
        setSubmitError(undefined)
        setIsSubmitting(false)
    }, [])

    const run = useCallback(async (submit: () => Promise<JobRef>) => {
        // Fresh attempt: drop any prior job/result/error so the poll re-arms on the
        // new id (design §1: stale flag is keyed on jobId).
        setJobId(null)
        setSubmitError(undefined)
        setIsSubmitting(true)
        try {
            const ref = await submit()
            setJobId(ref.jobId)
        } catch (error) {
            setSubmitError(error instanceof Error ? error : new Error(String(error)))
        } finally {
            setIsSubmitting(false)
        }
    }, [])

    return {
        run,
        reset,
        isSubmitting,
        submitError,
        isQuota: isQuotaError(submitError),
        jobId,
        poll,
        isBusy: isSubmitting || poll.isRunning,
    }
}
