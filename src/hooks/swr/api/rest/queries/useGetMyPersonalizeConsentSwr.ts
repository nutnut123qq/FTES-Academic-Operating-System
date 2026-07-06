"use client"

import useSWR from "swr"
import {
    getMyPersonalizeConsent,
    type RecommendationConsentView,
} from "@/modules/api/rest/recommendation"

/**
 * SWR query wrapper for {@link getMyPersonalizeConsent}.
 */
export const useGetMyPersonalizeConsentSwr = () => {
    const swr = useSWR<RecommendationConsentView, Error>(
        "GET_MY_PERSONALIZE_CONSENT_SWR",
        () => getMyPersonalizeConsent(),
    )

    return swr
}
