import useSWR from "swr"
import { queryAiSubscriptionTiers } from "@/modules/api/graphql/queries/query-ai-subscription-tiers"

/**
 * SWR query wrapper for {@link queryAiSubscriptionTiers}. `data` is the tier
 * array (empty when none are enabled).
 *
 * No page gate: its only consumer is the dashboard "My Plan" panel (`AiPlanSection`),
 * and the dashboard mounts ONLY the open tab — so the fetch already happens exactly
 * when that tab is opened. The gate this hook used to carry pointed at
 * `/profile/settings/ai-subscription`, a route that no longer exists; keeping it would
 * have left the tiers permanently unfetched.
 */
export const useQueryAiSubscriptionTiersSwr = () => {
    const swr = useSWR(
        ["QUERY_AI_SUBSCRIPTION_TIERS_SWR"],
        async () => {
            const data = await queryAiSubscriptionTiers({})

            if (!data || !data.data) {
                throw new Error("Failed to fetch AI subscription tiers")
            }

            return data.data.aiSubscriptionTiers?.data?.tiers ?? []
        },
    )

    return swr
}
