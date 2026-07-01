import useSWR from "swr"
import { queryMyAiLabRuns } from "@/modules/api/graphql/queries/query-my-ai-lab-runs"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link queryMyAiLabRuns}. `data` is the unwrapped list of
 * the viewer's prior runs for one playground (run history panel). User-scoped —
 * only runs once the viewer is authenticated and a `playgroundId` is present.
 */
export const useQueryMyAiLabRunsSwr = (playgroundId?: string) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR(
        authenticated && playgroundId ? ["QUERY_MY_AI_LAB_RUNS_SWR", playgroundId] : null,
        async () => {
            if (!playgroundId) {
                throw new Error("Playground id not found")
            }
            const data = await queryMyAiLabRuns({ playgroundId })

            if (!data || !data.data) {
                throw new Error("Failed to fetch AI Lab runs")
            }

            return data.data.myAiLabRuns?.data ?? []
        },
    )

    return swr
}
