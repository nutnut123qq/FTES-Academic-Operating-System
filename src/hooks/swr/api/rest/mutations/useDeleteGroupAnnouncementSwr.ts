import useSWRMutation from "swr/mutation"
import { deleteAnnouncement } from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link deleteAnnouncement}.
 */
export const useDeleteGroupAnnouncementSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; announcementId: string }
    >("DELETE_GROUP_ANNOUNCEMENT_SWR", async (_key, { arg }) => {
        return deleteAnnouncement(arg.id, arg.announcementId)
    })

    return swr
}
