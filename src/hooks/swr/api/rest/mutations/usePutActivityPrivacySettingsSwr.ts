import useSWRMutation from "swr/mutation"
import {
    updateActivityPrivacySettings,
    type ActivityPrivacyOverrideView,
} from "@/modules/api/rest/activity"

/**
 * SWR mutation wrapper for {@link updateActivityPrivacySettings}.
 */
export const usePutActivityPrivacySettingsSwr = () => {
    const swr = useSWRMutation<
        ActivityPrivacyOverrideView[],
        Error,
        string,
        ActivityPrivacyOverrideView[]
    >("PUT_ACTIVITY_PRIVACY_SETTINGS_SWR", async (_key, { arg }) => {
        return updateActivityPrivacySettings(arg)
    })

    return swr
}
