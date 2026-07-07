import useSWR from "swr"
import { useAppDispatch } from "@/redux/hooks"
import { setSystemConfig } from "@/redux/slices/system"
import { DEFAULT_SYSTEM_CONFIG } from "@/modules/types/system-config"

/**
 * Hydrates `state.system.config` with FE-side defaults.
 *
 * NEUTRALIZED: the real BE (FTES) exposes no public `systemConfig` GraphQL query
 * (only admin-scoped `systemConfigurations`), so this no longer calls the BE — it
 * dispatches {@link DEFAULT_SYSTEM_CONFIG} instead. Kept as a hook so the app-shell
 * side-effect mount (`SwrSideEffects`) still populates redux the same way.
 */
export const useQuerySystemConfigSwr = () => {
    const dispatch = useAppDispatch()
    const swr = useSWR(
        ["QUERY_SYSTEM_CONFIG_SWR"],
        async () => {
            dispatch(setSystemConfig(DEFAULT_SYSTEM_CONFIG))
            return DEFAULT_SYSTEM_CONFIG
        },
    )
    return swr
}
