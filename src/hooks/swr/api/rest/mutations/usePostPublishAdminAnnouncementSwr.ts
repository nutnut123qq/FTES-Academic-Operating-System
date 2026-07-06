import useSWRMutation from "swr/mutation"
import {
    publishAdminAnnouncement,
    type AdminAnnouncement,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link publishAdminAnnouncement}.
 */
export const usePostPublishAdminAnnouncementSwr = () => {
    const swr = useSWRMutation<AdminAnnouncement, Error, string, string>(
        "POST_PUBLISH_ADMIN_ANNOUNCEMENT_SWR",
        async (_key, { arg }) => {
            return publishAdminAnnouncement(arg)
        },
    )

    return swr
}
