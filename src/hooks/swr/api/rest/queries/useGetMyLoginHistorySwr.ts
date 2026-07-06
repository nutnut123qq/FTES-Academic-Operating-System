"use client"

import useSWR from "swr"
import {
    getMyLoginHistory,
    type SecurityLoginHistoryRequest,
    type SecurityLoginHistoryView,
    type SecurityPageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR query wrapper for {@link getMyLoginHistory}.
 */
export const useGetMyLoginHistorySwr = (request?: SecurityLoginHistoryRequest) => {
    const swr = useSWR<
        SecurityPageResponse<SecurityLoginHistoryView>,
        Error
    >(["GET_MY_LOGIN_HISTORY_SWR", request], () => getMyLoginHistory(request))

    return swr
}
