"use client"

import useSWR from "swr"

import { getPeSubmissionResult, type PeResultView } from "@/modules/api/rest/resource"

/** SWR key for one PE attempt's AI grade. */
export const peResultSwrKey = (resourceId: string, submissionId: string) =>
    ["PE_SUBMISSION_RESULT_SWR", resourceId, submissionId] as const

/**
 * Loads the AI grade of ONE PE attempt
 * (`GET /api/v1/resources/{id}/pe-submissions/{submissionId}/results`).
 *
 * Gated on both ids AND on the caller's `enabled` flag: the result endpoint only
 * answers once the attempt reached `SCORED`, so an attempt still `GRADING` must not be
 * asked for it.
 *
 * @param resourceId - The PE resource UUID.
 * @param submissionId - The attempt to read; `null` when none is selected.
 * @param enabled - `false` while the attempt has not been scored yet.
 * @returns The raw SWR handle over {@link PeResultView}.
 */
export const useQueryPeResultSwr = (
    resourceId: string,
    submissionId: string | null,
    enabled: boolean,
) => {
    return useSWR<PeResultView, Error>(
        resourceId && submissionId && enabled
            ? peResultSwrKey(resourceId, submissionId)
            : null,
        () => getPeSubmissionResult(resourceId, submissionId as string),
    )
}
