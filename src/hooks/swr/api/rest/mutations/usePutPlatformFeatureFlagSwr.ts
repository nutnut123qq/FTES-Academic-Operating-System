import useSWRMutation from "swr/mutation"
import {
    updatePlatformFeatureFlag,
    type PlatformFeatureFlag,
    type PlatformFeatureFlagRequest,
} from "@/modules/api/rest/platform"

/**
 * SWR mutation wrapper for {@link updatePlatformFeatureFlag}.
 */
export const usePutPlatformFeatureFlagSwr = () => {
    const swr = useSWRMutation<
        PlatformFeatureFlag,
        Error,
        string,
        { key: string; request: PlatformFeatureFlagRequest }
    >("PUT_PLATFORM_FEATURE_FLAG_SWR", async (_key, { arg }) => {
        return updatePlatformFeatureFlag(arg.key, arg.request)
    })

    return swr
}
