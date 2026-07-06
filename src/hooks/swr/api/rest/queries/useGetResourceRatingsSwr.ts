"use client"

import useSWR from "swr"
import {
    getResourceRatings,
    type RatingSummary,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getResourceRatings}.
 */
export const useGetResourceRatingsSwr = (
    id: string,
    params?: { page?: number; size?: number },
) => {
    const swr = useSWR<RatingSummary, Error>(
        ["GET_RESOURCE_RATINGS_SWR", id, params?.page, params?.size],
        () => getResourceRatings(id, params),
    )

    return swr
}
