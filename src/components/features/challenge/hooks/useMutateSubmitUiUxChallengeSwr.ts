"use client"

import useSWRMutation from "swr/mutation"

/** Arg bag for the mock UI/UX submit. */
export interface SubmitUiUxChallengeRequest {
    /** Total requirement count (checklist length). */
    total: number
    /** How many checklist items the learner ticked. */
    checked: number
    /** Whether the learner wrote any HTML at all (basic completeness heuristic). */
    hasHtml: boolean
}

/** Result of the mock scoring. */
export interface SubmitUiUxChallengeResult {
    /** Score 0–100 (FE heuristic — BE grading is an ASSUMPTION). */
    score: number
    /** Pass threshold reached. */
    passed: boolean
}

// ponytail: mock scoring — BE grading is an ASSUMPTION (no endpoint yet). Score =
// share of checklist ticked, floored to 0 when no HTML written. Swap for a real
// mutation(submitUiUxChallenge) when the contract lands; the hook API stays.
const submitUiUxChallengeMock = async (
    _key: string,
    { arg }: { arg: SubmitUiUxChallengeRequest },
): Promise<SubmitUiUxChallengeResult> => {
    const ratio = arg.total > 0 ? arg.checked / arg.total : 0
    const score = arg.hasHtml ? Math.round(ratio * 100) : 0
    return { score, passed: score >= 70 }
}

/**
 * Mock submit for a UI/UX challenge. Returns an FE-computed score/pass.
 * BE grading is an ASSUMPTION — the caller must surface a "mock" note in the UI.
 */
export const useMutateSubmitUiUxChallengeSwr = () =>
    useSWRMutation<
        SubmitUiUxChallengeResult,
        Error,
        string,
        SubmitUiUxChallengeRequest
    >("SUBMIT_UIUX_CHALLENGE_SWR", submitUiUxChallengeMock)
