"use client"

import useSWR from "swr"
import {
    querySecurityAdminLog,
    type SecurityAdminLogRequest,
    type SecurityLogView,
} from "@/modules/api/rest/identity-security"

/**
 * SWR query wrapper for {@link querySecurityAdminLog}.
 */
export const useGetSecurityAdminLogSwr = (request?: SecurityAdminLogRequest) => {
    const swr = useSWR<SecurityLogView[], Error>(
        ["GET_SECURITY_ADMIN_LOG_SWR", request],
        () => querySecurityAdminLog(request),
    )

    return swr
}
