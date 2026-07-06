"use client"

import useSWR from "swr"
import {
    getAdminPublicAnnouncements,
    type AdminAnnouncementView,
} from "@/modules/api/rest/admin"

/**
 * SWR query wrapper for {@link getAdminPublicAnnouncements}.
 */
export const useGetAdminPublicAnnouncementsSwr = () => {
    const swr = useSWR<AdminAnnouncementView[], Error>(
        "GET_ADMIN_PUBLIC_ANNOUNCEMENTS_SWR",
        () => getAdminPublicAnnouncements(),
    )

    return swr
}
