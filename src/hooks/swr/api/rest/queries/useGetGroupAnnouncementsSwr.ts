"use client"

import useSWR from "swr"
import {
    listAnnouncements,
    type GroupAnnouncement,
} from "@/modules/api/rest/group"

/**
 * SWR query wrapper for {@link listAnnouncements}.
 */
export const useGetGroupAnnouncementsSwr = (
    id: string,
    request?: {
        limit?: number
    },
) => {
    const swr = useSWR<GroupAnnouncement[], Error>(
        ["GET_GROUP_ANNOUNCEMENTS_SWR", id, request],
        () => listAnnouncements(id, request),
    )

    return swr
}
