import useSWR from "swr"
import { queryAiLabPlayground } from "@/modules/api/graphql/queries/query-ai-lab-playground"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link queryAiLabPlayground}. `data` is the unwrapped
 * playground payload (or `null` when the lesson has no playground). User-scoped —
 * only runs once the viewer is authenticated and a `contentId` is present.
 */
export const useQueryAiLabPlaygroundSwr = (contentId?: string) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR(
        authenticated && contentId ? ["QUERY_AI_LAB_PLAYGROUND_SWR", contentId] : null,
        async () => {
            if (!contentId) {
                throw new Error("Content id not found")
            }
            const data = await queryAiLabPlayground({ contentId })

            if (!data || !data.data) {
                throw new Error("Failed to fetch AI Lab playground")
            }

            return data.data.aiLabPlayground?.data ?? null
        },
    )

    return swr
}
