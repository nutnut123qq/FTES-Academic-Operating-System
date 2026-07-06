"use client"

import useSWR from "swr"
import { getMyReferral, type ReferralView } from "@/modules/api/rest/wallet"

/**
 * SWR query wrapper for {@link getMyReferral}.
 */
export const useGetMyReferralSwr = () => {
    const swr = useSWR<ReferralView, Error>(["GET_MY_REFERRAL_SWR"], () =>
        getMyReferral(),
    )

    return swr
}
