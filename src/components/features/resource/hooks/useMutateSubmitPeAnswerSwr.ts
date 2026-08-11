"use client"

import useSWRMutation from "swr/mutation"
import { useSWRConfig } from "swr"

import { submitPeAnswer, type PeSubmissionView } from "@/modules/api/rest/resource"
import { peSubmissionsSwrKey } from "./useQueryPeSubmissionsSwr"

/** Trigger arg for {@link useMutateSubmitPeAnswerSwr}. */
export interface SubmitPeAnswerParams {
    /** The PE resource being answered. */
    resourceId: string
    /** The answer file (Office / PDF / image / text / zip, ≤ 25 MB). */
    file: File
    /** Optional catalog model id; omit for the BE default grader. */
    model?: string
}

/**
 * Uploads a PE answer for AI grading (`POST /api/v1/resources/{id}/pe-submissions`).
 *
 * The BE answers immediately with `status: "GRADING"`, so the attempts list is
 * revalidated right away: the new row appears as "đang chấm" and
 * `useQueryPeSubmissionsSwr` takes over polling until it settles. Rejections
 * (`RESOURCE_PE_ATTEMPT_LIMIT`, `RESOURCE_PE_GRADER_UNAVAILABLE`,
 * `RESOURCE_PE_GRADING_FAILED`, `RESOURCE_RATE_LIMITED`) propagate as a `RestError`
 * for the caller to map onto a message.
 *
 * @returns The `useSWRMutation` handle (`trigger` / `isMutating`).
 */
export const useMutateSubmitPeAnswerSwr = () => {
    const { mutate } = useSWRConfig()

    return useSWRMutation<PeSubmissionView, Error, string, SubmitPeAnswerParams>(
        "POST_SUBMIT_PE_ANSWER_SWR",
        async (_key, { arg }) => {
            const submission = await submitPeAnswer(arg.resourceId, arg.file, arg.model)
            await mutate(peSubmissionsSwrKey(arg.resourceId)).catch(() => undefined)
            return submission
        },
    )
}
