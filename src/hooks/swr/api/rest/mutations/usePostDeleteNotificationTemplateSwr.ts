import useSWRMutation from "swr/mutation"
import { deleteNotificationTemplate } from "@/modules/api/rest/notification"

/**
 * SWR mutation wrapper for {@link deleteNotificationTemplate}.
 */
export const usePostDeleteNotificationTemplateSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_NOTIFICATION_TEMPLATE_SWR",
        async (_key, { arg }) => {
            return deleteNotificationTemplate(arg)
        },
    )

    return swr
}
