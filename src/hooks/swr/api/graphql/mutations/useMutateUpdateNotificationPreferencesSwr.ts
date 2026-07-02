import useSWRMutation from "swr/mutation"
import {
    mutateUpdateMyNotificationPreferences,
    type UpdateNotificationPreferencesRequest,
} from "@/modules/api/graphql/queries/query-my-notification-preferences"

type MutateUpdateNotificationPreferencesResult = Awaited<
    ReturnType<typeof mutateUpdateMyNotificationPreferences>
>

/**
 * SWR mutation wrapper for the (mock) `updateMyNotificationPreferences`
 * mutation. Pass the full `{ mutedTypes, muteAll }` state as the trigger arg;
 * the caller revalidates the preferences read hook after a successful write.
 */
export const useMutateUpdateNotificationPreferencesSwr = () => {
    return useSWRMutation<
        MutateUpdateNotificationPreferencesResult,
        Error,
        string,
        UpdateNotificationPreferencesRequest
    >(
        "MUTATE_UPDATE_NOTIFICATION_PREFERENCES_SWR",
        async (_key, { arg }) => mutateUpdateMyNotificationPreferences({ request: arg }),
    )
}
