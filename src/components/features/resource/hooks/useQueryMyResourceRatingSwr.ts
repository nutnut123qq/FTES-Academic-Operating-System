"use client"

import useSWR from "swr"

import { getMyResourceRating, type RatingResponse } from "@/modules/api/rest/resource"
import { useAppSelector } from "@/redux/hooks"

/** SWR key of the caller's own rating for one resource (shared by the query + the delete). */
export const myResourceRatingSwrKey = (resourceId: string) =>
    ["RESOURCE_MY_RATING_SWR", resourceId] as const

/**
 * Loads the caller's OWN rating of a resource (`GET /api/v1/resources/{id}/ratings/me`) so
 * the composer can be prefilled with the stars/review already stored instead of asking the
 * viewer to retype what the BE holds.
 *
 * "Not rated yet" is `data: null` on a `200` — NOT a 404 — so an empty answer is a normal
 * state, never an error. Auth-gated and lazy: the key is `null` for guests (the endpoint
 * requires a session), so a visitor's reviews page fires nothing.
 *
 * @param resourceId - The resource whose own-rating to read.
 */
export const useQueryMyResourceRatingSwr = (resourceId: string) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enabled = authenticated && Boolean(resourceId)

    const { data, isLoading, error, mutate } = useSWR<RatingResponse | null, Error>(
        enabled ? myResourceRatingSwrKey(resourceId) : null,
        () => getMyResourceRating(resourceId),
    )

    return {
        /** The caller's stored rating, or `null` when they have not rated the resource. */
        myRating: data ?? null,
        /** Whether the viewer already has a rating (drives "Update" vs "Submit" + delete). */
        hasRating: Boolean(data),
        isLoading: enabled ? isLoading : false,
        error,
        mutate,
    }
}
