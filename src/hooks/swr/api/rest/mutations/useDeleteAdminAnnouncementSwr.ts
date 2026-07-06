import useSWRMutation from "swr/mutation"
import {
    deleteAdminAnnouncement,
    type AdminDeleteAnnouncementRequest,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link deleteAdminAnnouncement}.
 */
export const useDeleteAdminAnnouncementSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; request: AdminDeleteAnnouncementRequest }
    >("DELETE_ADMIN_ANNOUNCEMENT_SWR", async (_key, { arg }) => {
        return deleteAdminAnnouncement(arg.id, arg.request)
    })

    return swr
}
