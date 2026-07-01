import { usePathname } from "next/navigation"
import useSWR from "swr"
import { querySystemHealthStatus } from "@/modules/api/graphql/queries/query-system-health-status"
import { SYSTEM_STATUS_REFRESH_MS } from "@/modules/api/graphql/queries/constants/system-status"

/** Public status page path — only here do we need to poll infra health. */
const STATUS_PATH = "/status"

/**
 * SWR query wrapper for {@link querySystemHealthStatus} (PUBLIC — no auth gate).
 *
 * Polls ONLY while on the `/status` page (the hook is otherwise free to mount at
 * root). Leaving the page → key `null` → SWR stops polling.
 */
export const useQuerySystemHealthStatusSwr = () => {
    const pathname = usePathname()
    const onStatusPage = pathname.includes(STATUS_PATH)

    const swr = useSWR(
        onStatusPage
            ? [
                "QUERY_SYSTEM_HEALTH_STATUS_SWR",
            ]
            : null,
        async () => {
            const response = await querySystemHealthStatus({})

            if (!response?.data) {
                throw new Error("Failed to fetch system health status")
            }

            return response.data.systemHealthStatus?.data ?? null
        },
        {
            refreshInterval: SYSTEM_STATUS_REFRESH_MS,
        },
    )

    return swr
}
