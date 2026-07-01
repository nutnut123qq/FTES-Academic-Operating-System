import useSWR from "swr"
import { queryMyKpis } from "@/modules/api/graphql/queries/query-my-kpis"
import type { QueryMyKpisData } from "@/modules/api/graphql/queries/types/my-kpis"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyKpis}. `data` is the viewer's weekly KPIs
 * (per-KPI progress + composite), or `null`. User-scoped — only runs once
 * authenticated.
 */
export const useQueryMyKpisSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryMyKpisData | null>(
        authenticated ? ["QUERY_MY_KPIS_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await queryMyKpis({})
            return result.data?.myKpis?.data ?? null
        },
    )
}
