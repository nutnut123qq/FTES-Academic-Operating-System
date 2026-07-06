import useSWRMutation from "swr/mutation"
import {
    updateAnnouncement,
    type GroupAnnouncement,
    type GroupAnnouncementUpdateRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link updateAnnouncement}.
 */
export const usePatchGroupAnnouncementSwr = () => {
    const swr = useSWRMutation<
        GroupAnnouncement,
        Error,
        string,
        {
            id: string
            announcementId: string
            request: GroupAnnouncementUpdateRequest
        }
    >("PATCH_GROUP_ANNOUNCEMENT_SWR", async (_key, { arg }) => {
        return updateAnnouncement(arg.id, arg.announcementId, arg.request)
    })

    return swr
}
