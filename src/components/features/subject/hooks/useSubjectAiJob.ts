"use client"

import { RestError } from "@/modules/api/rest/client"
import type { JobRef } from "@/modules/api/rest/ai/types"
import {
    useAiToolJob,
    type UseAiToolJobReturn,
} from "@/components/features/ai-platform/hooks/useAiToolJob"

/**
 * Shared submit→poll wiring for the per-subject AI tools (summary / quiz /
 * flashcards / OCR).
 *
 * The BE learning endpoints are ASYNC: `POST /ai/learning/{summary,quiz,flashcards,ocr}`
 * answers `1002 Accepted` with a `JobRef`, and the result only exists on
 * `GET /ai/jobs/{id}` once the worker flips the job to a terminal status. This hook
 * reuses the AI-hub orchestrator ({@link useAiToolJob} → `useAiJobPolling`) so the
 * subject tools poll on the SAME cadence and stop on the SAME terminal statuses
 * (COMPLETED / FAILED / CANCELLED) as `/ai/tools/*` — one poller, one contract.
 *
 * On top of it, it collapses every failure mode into a single localizable
 * {@link SubjectAiJobErrorKey} so each tool surface renders one honest message
 * instead of leaking an axios/envelope string.
 */

/**
 * The failure kinds a subject AI tool can surface, each mapping 1:1 to an i18n key
 * under `subjects.aiTools.job.*`.
 *
 * - `quota`     — HTTP 429 / a `*QUOTA*` domain code (the daily AI allowance is spent).
 * - `auth`      — 401: the session expired mid-flow (the CTA is auth-guarded up front).
 * - `forbidden` — 403: the caller lacks `ai.learning.use`, or the picked resource is
 *   not APPROVED / not readable (`AiInputGuard.requireResourceAccess`).
 * - `notFound`  — 404: the resource/job vanished (or belongs to someone else).
 * - `invalid`   — 400 `AI_INPUT_INVALID`: the reference the BE guard refused.
 * - `insufficientContext` — the job RAN and stopped at `AI_CONTEXT_INSUFFICIENT`: the
 *   lesson simply has too little text to work from. Actionable (pick another lesson),
 *   so it must not read as "the AI broke".
 * - `failed`    — everything else, incl. a job that ran and reached FAILED/CANCELLED.
 */
export type SubjectAiJobErrorKey =
    | "quota"
    | "auth"
    | "forbidden"
    | "notFound"
    | "invalid"
    | "insufficientContext"
    | "failed"

/**
 * Maps a submit rejection to the message key its surface should show.
 *
 * @param error - the error thrown by a `submit*Job` call (or anything else).
 * @returns the matching {@link SubjectAiJobErrorKey}; `failed` for non-REST errors.
 */
export const classifySubjectAiJobError = (error: unknown): SubjectAiJobErrorKey => {
    if (!(error instanceof RestError)) return "failed"
    // Quota first: the BE may answer 429 OR a 4xx carrying a *QUOTA* domain code.
    if (error.status === 429 || /QUOTA/i.test(error.errorCode ?? "")) return "quota"
    if (error.status === 401) return "auth"
    if (error.status === 403) return "forbidden"
    if (error.status === 404) return "notFound"
    if (error.status === 400) return "invalid"
    return "failed"
}

/** Domain codes a FAILED job can carry, mapped to the message its surface should show. */
const JOB_ERROR_CODE_KEYS: Record<string, SubjectAiJobErrorKey> = {
    AI_CONTEXT_INSUFFICIENT: "insufficientContext",
}

/**
 * Maps the domain code on a job that RAN and FAILED to its message key.
 *
 * A failed job is not automatically "the AI broke": `AI_CONTEXT_INSUFFICIENT` means the
 * lesson had too little text, which the learner can act on by picking another lesson.
 * The BE used to flatten every failure into `AI_JOB_ERROR` and hide the real code inside
 * `errorMessage`, so this layer deliberately showed one generic message rather than
 * string-matching prose. Since change `ai-job-error-fidelity` the BE keeps the real
 * domain code on the job, so it is now safe — and correct — to read it.
 *
 * @param errorCode - `JobView.errorCode` of a terminal FAILED job.
 * @returns the matching {@link SubjectAiJobErrorKey}; `failed` when the code is unknown.
 */
export const classifySubjectAiJobFailure = (
    errorCode: string | undefined,
): SubjectAiJobErrorKey => {
    if (!errorCode) return "failed"
    // A worker-side quota rejection reaches us on the job, not as a submit rejection.
    if (/QUOTA/i.test(errorCode)) return "quota"
    return JOB_ERROR_CODE_KEYS[errorCode] ?? "failed"
}

/** Return shape of {@link useSubjectAiJob}. */
export interface UseSubjectAiJobReturn<TResult> {
    /**
     * Submit a job: pass a factory that performs the `submit*Job` call and resolves
     * to its {@link JobRef}. Any async prep (a presigned upload for OCR) belongs
     * INSIDE the factory so it shares the same busy/error state.
     */
    run: (submit: () => Promise<JobRef>) => Promise<void>
    /** Drop the current job + result (back to the picker). */
    reset: () => void
    /** Parsed job result once COMPLETED, else undefined. */
    result: TResult | undefined
    /** True while submitting OR while the job is still PENDING/RUNNING. */
    isBusy: boolean
    /** True once a still-running job passed the 90s "taking longer than usual" mark. */
    isStale: boolean
    /** The message key to render, or null when nothing failed. */
    errorKey: SubjectAiJobErrorKey | null
    /** BE-provided failure detail on a job that reached FAILED, when present. */
    failureMessage: string | undefined
    /** Re-poll now (manual nudge on a stale job). */
    refresh: () => void
    /** Escape hatch to the underlying orchestrator (job id, raw poll, …). */
    raw: UseAiToolJobReturn<TResult>
}

/**
 * Runs one subject AI job end-to-end.
 *
 * `TResult` types the parsed `JobView.result` for the calling tool.
 */
export const useSubjectAiJob = <TResult = unknown>(): UseSubjectAiJobReturn<TResult> => {
    const job = useAiToolJob<TResult>()
    const { poll } = job

    // A submit rejection is the most specific signal; next, a job that RAN and failed
    // carries its own domain code; a poll that cannot reach the API is a plain failure.
    const errorKey: SubjectAiJobErrorKey | null = job.submitError
        ? classifySubjectAiJobError(job.submitError)
        : poll.isFailed
            ? classifySubjectAiJobFailure(poll.job?.errorCode)
            : poll.error
                ? "failed"
                : null

    return {
        run: job.run,
        reset: job.reset,
        result: poll.result,
        isBusy: job.isBusy,
        isStale: poll.isStale,
        errorKey,
        failureMessage: poll.job?.errorMessage,
        refresh: poll.refresh,
        raw: job,
    }
}
