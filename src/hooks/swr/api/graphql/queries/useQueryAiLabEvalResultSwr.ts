import useSWR from "swr"
import { queryAiLabEvalResult } from "@/modules/api/graphql/queries/query-ai-lab-eval-result"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link queryAiLabEvalResult}. `data` is the unwrapped eval
 * run result (or `null` when absent). Call `.mutate()` to refetch after the grading
 * job completes. User-scoped — only runs once the viewer is authenticated and an
 * `evalRunId` is present.
 */
export const useQueryAiLabEvalResultSwr = (evalRunId?: string) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR(
        authenticated && evalRunId ? ["QUERY_AI_LAB_EVAL_RESULT_SWR", evalRunId] : null,
        async () => {
            if (!evalRunId) {
                throw new Error("Eval run id not found")
            }
            const data = await queryAiLabEvalResult({ evalRunId })

            if (!data || !data.data) {
                throw new Error("Failed to fetch AI Lab eval result")
            }

            return data.data.aiLabEvalResult?.data ?? null
        },
    )

    return swr
}
