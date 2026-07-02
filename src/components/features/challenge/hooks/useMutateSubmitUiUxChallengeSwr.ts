"use client"

import useSWRMutation from "swr/mutation"

/** Submission payload for the UI/UX challenge editor. */
export interface SubmitUiUxChallengeRequest {
    challengeId: string
    html: string
    css: string
    js: string
    /** Self-ticked checklist items (mock grading input). */
    checkedCount: number
    /** Total checklist items. */
    totalCount: number
}

/** Mock grading result. BE grading contract là GIẢ ĐỊNH — chấm thật sẽ thay thế. */
export interface UiUxSubmissionResult {
    score: number
    passed: boolean
}

// ponytail: mock FE scoring — checklist ratio (80đ) + có markup/style (10đ mỗi thứ),
// pass ≥ 70. Swap for the real grading mutation when the BE contract lands; the
// hook API stays.
const submitUiUxChallengeMock = async (
    request: SubmitUiUxChallengeRequest,
): Promise<UiUxSubmissionResult> => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    const checklistRatio =
        request.totalCount === 0 ? 0 : request.checkedCount / request.totalCount
    const markupBonus = request.html.trim().length > 0 ? 10 : 0
    const styleBonus = request.css.trim().length > 0 ? 10 : 0
    const score = Math.round(checklistRatio * 80 + markupBonus + styleBonus)
    return { score, passed: score >= 70 }
}

/** Submits a UI/UX challenge attempt. Mocked; SWR-shaped for a drop-in BE swap. */
export const useMutateSubmitUiUxChallengeSwr = () => {
    const { trigger, isMutating, data, reset } = useSWRMutation<
        UiUxSubmissionResult,
        Error,
        string,
        SubmitUiUxChallengeRequest
    >("SUBMIT_UIUX_CHALLENGE", (_, { arg }) => submitUiUxChallengeMock(arg))
    return { submit: trigger, isSubmitting: isMutating, result: data, resetResult: reset }
}
