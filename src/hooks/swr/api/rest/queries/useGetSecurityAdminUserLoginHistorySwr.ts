"use client"

import useSWR from "swr"
import {
    getSecurityAdminUserLoginHistory,
    type SecurityLoginHistoryRequest,
    type SecurityLoginHistoryView,
    type SecurityPageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR query wrapper for {@link getSecurityAdminUserLoginHistory}.
 */
export const useGetSecurityAdminUserLoginHistorySwr = (
    userId: string,
    request?: SecurityLoginHistoryRequest,
) => {
    const swr = useSWR<
        SecurityPageResponse<SecurityLoginHistoryView>,
        Error
    >(["GET_SECURITY_ADMIN_USER_LOGIN_HISTORY_SWR", userId, request], () =>
        getSecurityAdminUserLoginHistory(userId, request),
    )

    return swr
}
