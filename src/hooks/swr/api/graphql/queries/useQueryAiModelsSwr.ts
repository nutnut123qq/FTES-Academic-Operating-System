import { usePathname } from "next/navigation"
import useSWR from "swr"
import { queryAiModels } from "@/modules/api/graphql/queries/query-ai-models"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setAiModels } from "@/redux/slices/ai-models"

/**
 * SWR query core for the AI models query. Returns the viewer's tier-scoped model
 * list, so it only runs once the viewer is authenticated. Only fetches under `/learn`
 * (consumers: StarciAi + ChallengeModal submission panel) — avoids fetching outside the learn area.
 * @returns the SWR query handle.
 */
export const useQueryAiModelsSwr = () => {
    const dispatch = useAppDispatch()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const pathname = usePathname()
    const onLearnPage = pathname.includes("/learn")

    const swr = useSWR(
        authenticated && onLearnPage ? ["QUERY_AI_MODELS_SWR"] : null,
        async () => {
            const data = await queryAiModels({})

            if (!data || !data.data) {
                throw new Error("Failed to fetch AI models")
            }

            const result = data.data.aiModels?.data
            if (result) {
                dispatch(setAiModels({
                    tier: result.tier,
                    models: result.models,
                }))
            }

            return data.data
        },
    )

    return swr
}
