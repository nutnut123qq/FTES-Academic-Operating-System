"use client"

import useSWR from "swr"
import {
    getMyPersonalizeContext,
    type RecommendationPersonalizeContext,
} from "@/modules/api/rest/recommendation"

/**
 * SWR query wrapper for {@link getMyPersonalizeContext}.
 */
export const useGetMyPersonalizeContextSwr = (request?: {
    limit?: number
}) => {
    const swr = useSWR<RecommendationPersonalizeContext, Error>(
        ["GET_MY_PERSONALIZE_CONTEXT_SWR", request],
        () => getMyPersonalizeContext(request),
    )

    return swr
}
