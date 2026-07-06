import useSWRMutation from "swr/mutation"
import {
    createAnnouncement,
    type GroupAnnouncement,
    type GroupAnnouncementRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link createAnnouncement}.
 */
export const usePostCreateGroupAnnouncementSwr = () => {
    const swr = useSWRMutation<
        GroupAnnouncement,
        Error,
        string,
        { id: string; request: GroupAnnouncementRequest }
    >("POST_CREATE_GROUP_ANNOUNCEMENT_SWR", async (_key, { arg }) => {
        return createAnnouncement(arg.id, arg.request)
    })

    return swr
}
