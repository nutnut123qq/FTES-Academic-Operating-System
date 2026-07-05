import useSWRMutation from "swr/mutation"
import {
    applyChallengeManualScores,
    type ManualScoreItem,
} from "@/modules/api/rest/challenges"

/**
 * Params for {@link usePostApplyChallengeManualScoresSwr}.
 */
export interface ApplyChallengeManualScoresParams {
    /** Challenge id. */
    id: string
    /** Submission id. */
    submissionId: string
    /** Manual score entries. */
    scores: Array<ManualScoreItem>
}

/**
 * SWR mutation wrapper for {@link applyChallengeManualScores}.
 */
export const usePostApplyChallengeManualScoresSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        ApplyChallengeManualScoresParams
    >(
        "POST_APPLY_CHALLENGE_MANUAL_SCORES_SWR",
        async (_key, { arg }) => {
            return applyChallengeManualScores(arg.id, arg.submissionId, arg.scores)
        },
    )

    return swr
}
