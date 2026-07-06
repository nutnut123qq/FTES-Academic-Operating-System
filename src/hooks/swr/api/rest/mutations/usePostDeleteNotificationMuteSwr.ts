import useSWRMutation from "swr/mutation"
import { deleteNotificationMute } from "@/modules/api/rest/notification"

/**
 * SWR mutation wrapper for {@link deleteNotificationMute}.
 */
export const usePostDeleteNotificationMuteSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_NOTIFICATION_MUTE_SWR",
        async (_key, { arg }) => {
            return deleteNotificationMute(arg)
        },
    )

    return swr
}
