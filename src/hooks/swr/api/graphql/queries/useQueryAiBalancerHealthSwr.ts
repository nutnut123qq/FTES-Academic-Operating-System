import { usePathname } from "next/navigation"
import useSWR from "swr"
import { queryAiBalancerHealth } from "@/modules/api/graphql/queries/query-ai-balancer-health"
import { AI_BALANCER_HEALTH_REFRESH_MS } from "@/modules/api/graphql/queries/constants/ai-balancer-health"
import { useAppSelector } from "@/redux/hooks"

/** Admin AI balancer page path — only here do we need to poll health. */
const AI_BALANCER_PATH = "/admin/tools/ai-balancer"

/**
 * SWR query wrapper for {@link queryAiBalancerHealth}.
 *
 * Polls ONLY when logged in AND on the admin balancer page (mounted at root, so
 * without a gate it would poll app-wide in the background). Leaving the page → key `null` → SWR stops polling.
 */
export const useQueryAiBalancerHealthSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const pathname = usePathname()
    const onBalancerPage = pathname.includes(AI_BALANCER_PATH)

    const swr = useSWR(
        authenticated && onBalancerPage
            ? [
                "QUERY_AI_BALANCER_HEALTH_SWR",
            ]
            : null,
        async () => {
            const response = await queryAiBalancerHealth({
            })

            if (!response?.data) {
                throw new Error("Failed to fetch AI balancer health")
            }

            return response.data.aiBalancerHealth?.data ?? null
        },
        {
            refreshInterval: AI_BALANCER_HEALTH_REFRESH_MS,
        },
    )

    return swr
}
