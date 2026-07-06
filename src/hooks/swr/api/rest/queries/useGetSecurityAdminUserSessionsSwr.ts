"use client"

import useSWR from "swr"
import {
    listSecurityAdminUserSessions,
    type SecurityAdminSessionView,
} from "@/modules/api/rest/identity-security"

/**
 * SWR query wrapper for {@link listSecurityAdminUserSessions}.
 */
export const useGetSecurityAdminUserSessionsSwr = (userId: string) => {
    const swr = useSWR<SecurityAdminSessionView[], Error>(
        ["GET_SECURITY_ADMIN_USER_SESSIONS_SWR", userId],
        () => listSecurityAdminUserSessions(userId),
    )

    return swr
}
