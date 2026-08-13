"use client"

import useSWR from "swr"
import { getMfaStatus, type MfaStatusResponse } from "@/modules/api/rest/identity"

/** Shared SWR key — `use2fa` (TOTP) and the settings 2FA section read ONE cache. */
export const MFA_STATUS_SWR_KEY = "GET_MFA_STATUS_SWR"

/**
 * SWR query wrapper for {@link getMfaStatus}.
 */
export const useGetMfaStatusSwr = () => {
    const swr = useSWR<MfaStatusResponse, Error>(
        MFA_STATUS_SWR_KEY,
        getMfaStatus,
    )

    return swr
}
