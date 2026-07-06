import useSWRMutation from "swr/mutation"
import {
    updatePrivacySettings,
    type ProfilePrivacySettings,
} from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link updatePrivacySettings}.
 */
export const usePostUpdatePrivacySettingsSwr = () => {
    const swr = useSWRMutation<
        ProfilePrivacySettings,
        Error,
        string,
        ProfilePrivacySettings
    >("POST_UPDATE_PRIVACY_SETTINGS_SWR", async (_key, { arg }) => {
        return updatePrivacySettings(arg)
    })

    return swr
}
