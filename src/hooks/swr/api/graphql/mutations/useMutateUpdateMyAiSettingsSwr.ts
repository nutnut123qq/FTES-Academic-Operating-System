import useSWRMutation from "swr/mutation"
import { mutateUpdateMyAiSettings } from "@/modules/api/graphql/mutations/mutation-update-my-ai-settings"
import { type UpdateMyAiSettingsRequest } from "@/modules/api/graphql/mutations/types/update-my-ai-settings"

type MutateUpdateMyAiSettingsResult = Awaited<ReturnType<typeof mutateUpdateMyAiSettings>>

/**
 * SWR mutation wrapper for {@link mutateUpdateMyAiSettings} (Bearer from Keycloak).
 */
export const useMutateUpdateMyAiSettingsSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateUpdateMyAiSettingsResult,
        Error,
        string,
        UpdateMyAiSettingsRequest
    >(
        "MUTATE_UPDATE_MY_AI_SETTINGS_SWR",
        async (_key, { arg }) => {
            return mutateUpdateMyAiSettings({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
