"use client"

import useSWR from "swr"
import { getMfaStatus, type MfaStatusResponse } from "@/modules/api/rest/identity"

/**
 * SWR query wrapper for {@link getMfaStatus}.
 */
export const useGetMfaStatusSwr = () => {
    const swr = useSWR<MfaStatusResponse, Error>(
        "GET_MFA_STATUS_SWR",
        getMfaStatus,
    )

    return swr
}
