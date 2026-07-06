import useSWRMutation from "swr/mutation"
import {
    createNotificationMute,
    type MuteRequest,
    type MuteView,
} from "@/modules/api/rest/notification"

/**
 * SWR mutation wrapper for {@link createNotificationMute}.
 */
export const usePostCreateNotificationMuteSwr = () => {
    const swr = useSWRMutation<MuteView, Error, string, MuteRequest>(
        "POST_CREATE_NOTIFICATION_MUTE_SWR",
        async (_key, { arg }) => {
            return createNotificationMute(arg)
        },
    )

    return swr
}
