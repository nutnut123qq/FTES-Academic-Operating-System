import useSWRMutation from "swr/mutation"
import {
    patchAdminAnnouncement,
    type AdminAnnouncement,
    type AdminPatchAnnouncementRequest,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link patchAdminAnnouncement}.
 */
export const usePatchAdminAnnouncementSwr = () => {
    const swr = useSWRMutation<
        AdminAnnouncement,
        Error,
        string,
        { id: string; request: AdminPatchAnnouncementRequest }
    >("PATCH_ADMIN_ANNOUNCEMENT_SWR", async (_key, { arg }) => {
        return patchAdminAnnouncement(arg.id, arg.request)
    })

    return swr
}
