import useSWR from "swr"
import { queryMyAiQuota } from "@/modules/api/graphql/queries/query-my-ai-quota"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link queryMyAiQuota}. `data` is the unwrapped quota
 * snapshot payload (or `null` when absent). User-scoped — only runs once the
 * viewer is authenticated (otherwise it fires a guaranteed-401 on every page).
 */
export const useQueryMyAiQuotaSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR(
        authenticated ? ["QUERY_MY_AI_QUOTA_SWR"] : null,
        async () => {
            const data = await queryMyAiQuota({})

            if (!data || !data.data) {
                throw new Error("Failed to fetch AI quota")
            }

            return data.data.myAiQuota?.data ?? null
        },
    )

    return swr
}
