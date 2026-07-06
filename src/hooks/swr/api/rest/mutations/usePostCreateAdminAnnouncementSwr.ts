import useSWRMutation from "swr/mutation"
import {
    createAdminAnnouncement,
    type AdminAnnouncement,
    type AdminCreateAnnouncementRequest,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link createAdminAnnouncement}.
 */
export const usePostCreateAdminAnnouncementSwr = () => {
    const swr = useSWRMutation<
        AdminAnnouncement,
        Error,
        string,
        AdminCreateAnnouncementRequest
    >("POST_CREATE_ADMIN_ANNOUNCEMENT_SWR", async (_key, { arg }) => {
        return createAdminAnnouncement(arg)
    })

    return swr
}
