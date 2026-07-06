import useSWRMutation from "swr/mutation"
import {
    updateNotificationTemplate,
    type TemplateRequest,
    type TemplateView,
} from "@/modules/api/rest/notification"

/**
 * SWR mutation wrapper for {@link updateNotificationTemplate}.
 */
export const usePostUpdateNotificationTemplateSwr = () => {
    const swr = useSWRMutation<
        TemplateView,
        Error,
        string,
        { id: string; request: TemplateRequest }
    >("POST_UPDATE_NOTIFICATION_TEMPLATE_SWR", async (_key, { arg }) => {
        return updateNotificationTemplate(arg.id, arg.request)
    })

    return swr
}
