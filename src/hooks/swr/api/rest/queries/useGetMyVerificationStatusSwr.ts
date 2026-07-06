"use client"

import useSWR from "swr"
import {
    getMyVerificationStatus,
    type SecurityVerificationStatusView,
} from "@/modules/api/rest/identity-security"

/**
 * SWR query wrapper for {@link getMyVerificationStatus}.
 */
export const useGetMyVerificationStatusSwr = () => {
    const swr = useSWR<SecurityVerificationStatusView, Error>(
        "GET_MY_VERIFICATION_STATUS_SWR",
        () => getMyVerificationStatus(),
    )

    return swr
}
