import useSWRMutation from "swr/mutation"
import {
    createNotificationTemplate,
    type TemplateRequest,
    type TemplateView,
} from "@/modules/api/rest/notification"

/**
 * SWR mutation wrapper for {@link createNotificationTemplate}.
 */
export const usePostCreateNotificationTemplateSwr = () => {
    const swr = useSWRMutation<TemplateView, Error, string, TemplateRequest>(
        "POST_CREATE_NOTIFICATION_TEMPLATE_SWR",
        async (_key, { arg }) => {
            return createNotificationTemplate(arg)
        },
    )

    return swr
}
