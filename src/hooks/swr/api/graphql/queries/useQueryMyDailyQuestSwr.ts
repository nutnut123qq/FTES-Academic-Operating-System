import useSWR from "swr"
import { queryMyDailyQuest } from "@/modules/api/graphql/queries/query-my-daily-quest"
import type { QueryMyDailyQuestData } from "@/modules/api/graphql/queries/types/my-daily-quest"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyDailyQuest}. `data` is the viewer's daily quest
 * for today (per-task progress + claim state), or `null`. User-scoped — only runs
 * once authenticated.
 */
export const useQueryMyDailyQuestSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryMyDailyQuestData | null>(
        authenticated ? ["QUERY_MY_DAILY_QUEST_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await queryMyDailyQuest({})
            return result.data?.myDailyQuest?.data ?? null
        },
    )
}
