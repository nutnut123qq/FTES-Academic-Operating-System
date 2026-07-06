import useSWRMutation from "swr/mutation"
import {
    updatePlatformAiProvider,
    type PlatformAiProvider,
    type PlatformAiProviderRequest,
} from "@/modules/api/rest/platform"

/**
 * SWR mutation wrapper for {@link updatePlatformAiProvider}.
 */
export const usePutPlatformAiProviderSwr = () => {
    const swr = useSWRMutation<
        PlatformAiProvider,
        Error,
        string,
        { id: string; request: PlatformAiProviderRequest }
    >("PUT_PLATFORM_AI_PROVIDER_SWR", async (_key, { arg }) => {
        return updatePlatformAiProvider(arg.id, arg.request)
    })

    return swr
}
