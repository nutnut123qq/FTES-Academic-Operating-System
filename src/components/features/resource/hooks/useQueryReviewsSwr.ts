"use client"

import useSWR from "swr"

import {
    getResourceRatings,
    type RatingResponse,
    type RatingSummary,
} from "@/modules/api/rest/resource"

/** One resource review row as returned by the BE. */
export type Review = RatingResponse

/** Star buckets rendered in the distribution bars, best first. */
export const REVIEW_STAR_BUCKETS = [5, 4, 3, 2, 1] as const

/** SWR key for a page of a resource's ratings (shared by the query + the rating write). */
export const resourceRatingsSwrKey = (resourceId: string, page: number, size: number) =>
    ["RESOURCE_RATINGS_SWR", resourceId, page, size] as const

/**
 * Loads a resource's rating aggregate + one page of reviews from the real BE
 * (`GET /api/v1/resources/{id}/ratings?page=&size=`) — average, rating count, the 1–5 star
 * distribution and the review rows, all computed server-side.
 *
 * `page` is 1-indexed here (the FE convention) and shifted onto the BE's 0-indexed param.
 * Read access is enforced server-side by the resource `VisibilityGuard`.
 *
 * @param resourceId - The resource whose ratings to load.
 * @param params - 1-indexed `page` and page `size`.
 */
export const useQueryReviewsSwr = (
    resourceId: string,
    params?: { page?: number; size?: number },
) => {
    const page = params?.page ?? 1
    const size = params?.size ?? 10

    const { data, isLoading, isValidating, error, mutate } = useSWR<RatingSummary, Error>(
        resourceId ? resourceRatingsSwrKey(resourceId, page, size) : null,
        () => getResourceRatings(resourceId, { page: Math.max(page - 1, 0), size }),
    )

    return {
        summary: data,
        reviews: data?.reviews ?? [],
        /** Average stars (0 until somebody rates). */
        avg: data?.avg ?? 0,
        /** How many ratings the resource has. */
        count: data?.count ?? 0,
        /** `{ "5": n, ... }` — how many ratings landed in each star bucket. */
        distribution: data?.distribution ?? {},
        /** Total reviews across pages (drives the pager). */
        total: data?.total ?? 0,
        page,
        size,
        isLoading,
        isValidating,
        error,
        mutate,
    }
}
