"use client"

import useSWR from "swr"
import {
    getPersonalizeContextOf,
    type RecommendationPersonalizeContext,
} from "@/modules/api/rest/recommendation"

/**
 * SWR query wrapper for {@link getPersonalizeContextOf}.
 */
export const useGetPersonalizeContextOfSwr = (
    userId: string,
    request?: {
        limit?: number
    },
) => {
    const swr = useSWR<RecommendationPersonalizeContext, Error>(
        ["GET_PERSONALIZE_CONTEXT_OF_SWR", userId, request],
        () => getPersonalizeContextOf(userId, request),
    )

    return swr
}
