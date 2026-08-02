"use client"

import useSWR from "swr"
import {
    getChallengeSubmissionResults,
    type SubmissionResultsView,
} from "@/modules/api/rest/challenges"

/**
 * Loads the detailed results of ONE graded challenge submission
 * (`getChallengeSubmissionResults`) so the attempts list can re-open its AI feedback
 * (`aiFeedback` — score / verdict / criteria) without re-submitting.
 *
 * Lazily gated: the key stays `null` (no request) until {@link enabled} — the caller
 * flips it when the learner expands "Xem kết quả", so the surface only fetches the
 * feedback the learner actually opens. `shouldRetryOnError:false` keeps a failed read
 * (e.g. a 403) from looping; the UI-local hook does not dispatch to Redux.
 *
 * @param challengeId - The real challenge UUID the submission belongs to.
 * @param submissionId - The submission whose results to load.
 * @param enabled - Fetch only while true (the row is expanded).
 */
export const useQueryChallengeSubmissionResultsSwr = (
    challengeId: string,
    submissionId: string,
    enabled: boolean,
) => {
    return useSWR<SubmissionResultsView, Error>(
        enabled && challengeId && submissionId
            ? ["CHALLENGE_SUBMISSION_RESULTS", challengeId, submissionId]
            : null,
        () => getChallengeSubmissionResults(challengeId, submissionId),
        { shouldRetryOnError: false },
    )
}
