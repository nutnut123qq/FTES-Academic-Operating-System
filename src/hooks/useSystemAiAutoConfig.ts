import { useAppSelector } from "@/redux/hooks"
import type { SystemConfigAiAutoData } from "@/modules/types/system-config"

/**
 * Auto-lane caps from mounted `app.yaml` (`systemConfig.ai.auto`), hydrated via
 * {@link useQuerySystemConfigSwr} into Redux.
 * @returns Auto quota config, or `undefined` before the first successful fetch.
 */
export const useSystemAiAutoConfig = (): SystemConfigAiAutoData | undefined => {
    return useAppSelector((state) => state.system.config?.ai?.auto)
}
