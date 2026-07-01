import { usePathname } from "next/navigation"
import useSWR from "swr"
import { queryAiKeyHealth } from "@/modules/api/graphql/queries/query-ai-key-health"
import { SYSTEM_STATUS_REFRESH_MS } from "@/modules/api/graphql/queries/constants/system-status"

/** Public status page path — only here do we need to poll AI key health. */
const STATUS_PATH = "/status"

/**
 * SWR query wrapper for {@link queryAiKeyHealth} (PUBLIC — no auth gate).
 *
 * Polls ONLY while on the `/status` page. Leaving the page → key `null` → SWR
 * stops polling.
 */
export const useQueryAiKeyHealthSwr = () => {
    const pathname = usePathname()
    const onStatusPage = pathname.includes(STATUS_PATH)

    const swr = useSWR(
        onStatusPage
            ? [
                "QUERY_AI_KEY_HEALTH_SWR",
            ]
            : null,
        async () => {
            const response = await queryAiKeyHealth({})

            if (!response?.data) {
                throw new Error("Failed to fetch AI key health")
            }

            return response.data.aiKeyHealth?.data ?? null
        },
        {
            refreshInterval: SYSTEM_STATUS_REFRESH_MS,
        },
    )

    return swr
}
