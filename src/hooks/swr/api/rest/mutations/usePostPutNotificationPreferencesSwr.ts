import useSWRMutation from "swr/mutation"
import {
    putNotificationPreferences,
    toNotificationPreferencesData,
    toPreferenceUpdates,
} from "@/modules/api/rest/notification"
import type { QueryNotificationPreferencesData } from "@/modules/api/graphql/queries/types/notification-preferences"

/**
 * SWR mutation for `PUT /api/v1/notifications/preferences`. Trigger with the
 * full FE `{mutedTypes, muteAll}` state; it expands to the IN_APP column of
 * the backend matrix ({@link toPreferenceUpdates}) and resolves with the saved
 * state derived from the response, so the caller can populate the read cache
 * with it (optimistic update + rollback live in the preferences surface).
 */
export const usePostPutNotificationPreferencesSwr = () => {
    const swr = useSWRMutation<
        QueryNotificationPreferencesData,
        Error,
        string,
        QueryNotificationPreferencesData
    >("POST_PUT_NOTIFICATION_PREFERENCES_SWR", async (_key, { arg }) => {
        return toNotificationPreferencesData(
            await putNotificationPreferences(toPreferenceUpdates(arg)),
        )
    })

    return swr
}
