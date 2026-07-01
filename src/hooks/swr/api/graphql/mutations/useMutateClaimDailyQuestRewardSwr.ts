import useSWRMutation from "swr/mutation"
import { mutateClaimDailyQuestReward } from "@/modules/api/graphql/mutations/mutation-claim-daily-quest-reward"

type MutateClaimDailyQuestRewardResult = Awaited<ReturnType<typeof mutateClaimDailyQuestReward>>

/**
 * SWR mutation wrapper for {@link mutateClaimDailyQuestReward} (Bearer from
 * Keycloak). No request body — claims today's completed quest.
 */
export const useMutateClaimDailyQuestRewardSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateClaimDailyQuestRewardResult,
        Error,
        string
    >(
        "MUTATE_CLAIM_DAILY_QUEST_REWARD_SWR",
        async () => {
            return mutateClaimDailyQuestReward({})
        },
    )
    /** Return the SWR mutation. */
    return swr
}
