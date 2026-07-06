import useSWRMutation from "swr/mutation"
import {
    updateModelConfig,
    type ModelConfigView,
    type UpdateModelConfigRequest,
} from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link updateModelConfig}.
 */
export const usePostUpdateModelConfigSwr = () => {
    const swr = useSWRMutation<
        ModelConfigView,
        Error,
        string,
        { feature: string; request: UpdateModelConfigRequest }
    >("POST_UPDATE_MODEL_CONFIG_SWR", async (_key, { arg }) => {
        return updateModelConfig(arg.feature, arg.request)
    })

    return swr
}
