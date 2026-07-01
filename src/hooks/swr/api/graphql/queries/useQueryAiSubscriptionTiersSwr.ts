import { usePathname } from "next/navigation"
import useSWR from "swr"
import { queryAiSubscriptionTiers } from "@/modules/api/graphql/queries/query-ai-subscription-tiers"

/**
 * SWR query wrapper for {@link queryAiSubscriptionTiers}. `data` is the tier
 * array (empty when none are enabled). Only fetches on the AI subscription page
 * (its only consumer) — mounted at root, so without a gate it would fetch on every page.
 */
export const useQueryAiSubscriptionTiersSwr = () => {
    const pathname = usePathname()
    const onPage = pathname.includes("/profile/settings/ai-subscription")
    const swr = useSWR(
        onPage ? ["QUERY_AI_SUBSCRIPTION_TIERS_SWR"] : null,
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
