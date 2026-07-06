import useSWRMutation from "swr/mutation"
import {
    updatePlatformConfiguration,
    type PlatformConfiguration,
    type PlatformConfigurationRequest,
} from "@/modules/api/rest/platform"

/**
 * SWR mutation wrapper for {@link updatePlatformConfiguration}.
 */
export const usePutPlatformConfigurationSwr = () => {
    const swr = useSWRMutation<
        PlatformConfiguration,
        Error,
        string,
        { key: string; request: PlatformConfigurationRequest }
    >("PUT_PLATFORM_CONFIGURATION_SWR", async (_key, { arg }) => {
        return updatePlatformConfiguration(arg.key, arg.request)
    })

    return swr
}
