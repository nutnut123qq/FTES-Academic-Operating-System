import type {
    ChallengeGradeSelection,
} from "../types"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import { type AiGradableModel } from "@/modules/api/graphql/queries/types/ai-models"
import type { UserChallengeSubmissionEntity } from "@/modules/types/entities/user-challenge-submission"

/** The free Auto lane — balancer picks a complimentary model, no model chosen. */
export const AUTO_GRADE_SELECTION: ChallengeGradeSelection = {
    mode: AiMode.Auto,
    model: null,
    provider: null,
}

/**
 * Resolve the initial grading selection for a submission row.
 *
 * Priority: (1) the user's persisted pick on the submission row, (2) a
 * premium-category model when the user is entitled to Premium, (3) the free
 * Auto lane as the safe fallback.
 *
 * @param userSubmission - persisted submission row, if any.
 * @param models - enabled catalog models the picker offers.
 * @param canPremium - whether the user may use the Premium lane.
 * @returns the lane + model to seed the row's picker with.
 */
export const resolveInitialGradeSelection = (
    userSubmission: UserChallengeSubmissionEntity | null | undefined,
    models: Array<AiGradableModel>,
    canPremium: boolean,
): ChallengeGradeSelection => {
    // 1) restore a previously persisted pick
    if (userSubmission?.selectedMode) {
        return {
            mode: userSubmission.selectedMode,
            model: userSubmission.selectedModel ?? null,
            provider: userSubmission.selectedModelProvider ?? null,
        }
    }
    // 2) default to a premium model when the user can use the Premium lane
    if (canPremium && models.length > 0) {
        const premium = models.find(
            (model) => model.category === AiModelCategory.Premium,
        ) ?? models[0]
        return {
            mode: AiMode.Premium,
            model: premium.model,
            provider: premium.provider,
        }
    }
    // 3) safe fallback — free Auto lane
    return AUTO_GRADE_SELECTION
}
