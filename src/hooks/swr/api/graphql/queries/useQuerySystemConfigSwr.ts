import useSWR from "swr"
import { querySystemConfig } from "@/modules/api/graphql/queries/query-system-config"
import { useAppDispatch } from "@/redux/hooks"
import { setSystemConfig } from "@/redux/slices/system"

/**
 * Loads system config and hydrates `state.system.config`.
 */
export const useQuerySystemConfigSwr = () => {
    const dispatch = useAppDispatch()
    const swr = useSWR(
        ["QUERY_SYSTEM_CONFIG_SWR"],
        async () => {
            const { data } = await querySystemConfig({})
            const envelope = data?.systemConfig
            const inner = envelope?.data
            if (!envelope?.success || !inner) {
                throw new Error(
                    envelope?.error ?? envelope?.message ?? "System config not found",
                )
            }
            dispatch(setSystemConfig(inner))
            return inner
        },
    )
    return swr
}
