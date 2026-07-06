import useSWRMutation from "swr/mutation"
import {
    putNotificationPreferences,
    type PreferenceCell,
    type PreferenceUpdate,
} from "@/modules/api/rest/notification"

/**
 * SWR mutation wrapper for {@link putNotificationPreferences}.
 */
export const usePostPutNotificationPreferencesSwr = () => {
    const swr = useSWRMutation<
        Array<PreferenceCell>,
        Error,
        string,
        Array<PreferenceUpdate>
    >("POST_PUT_NOTIFICATION_PREFERENCES_SWR", async (_key, { arg }) => {
        return putNotificationPreferences(arg)
    })

    return swr
}
