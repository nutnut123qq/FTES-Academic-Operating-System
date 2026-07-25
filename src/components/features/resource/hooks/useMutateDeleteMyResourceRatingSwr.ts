"use client"

import { useCallback, useState } from "react"

import { deleteMyResourceRating } from "@/modules/api/rest/resource"
import { classifyRateResourceError, type RateResourceFailure } from "./useMutateRateResourceSwr"

/**
 * What came back from deleting the caller's own rating, already classified so the caller
 * only picks copy. `deleted` also covers "there was nothing to delete": the endpoint is
 * idempotent, so a repeated confirm is a success, not an error.
 */
export type DeleteMyResourceRatingOutcome = { status: "deleted" } | RateResourceFailure

/**
 * Deletes the caller's own rating of a resource
 * (`DELETE /api/v1/resources/{id}/ratings/me`).
 *
 * Never rejects: failures are classified through {@link classifyRateResourceError} — the
 * same mapping the rating write uses — so the reviews page maps an outcome onto a message
 * (`403` no access, `404` resource gone, `429` too fast) instead of catching. The caller
 * revalidates BOTH the reviews list (the aggregate avg/count changes) and its own-rating
 * cache afterwards.
 *
 * @returns `remove(resourceId)` plus `isMutating`.
 */
export const useMutateDeleteMyResourceRatingSwr = () => {
    const [isMutating, setIsMutating] = useState(false)

    const remove = useCallback(
        async (resourceId: string): Promise<DeleteMyResourceRatingOutcome> => {
            setIsMutating(true)
            try {
                await deleteMyResourceRating(resourceId)
                return { status: "deleted" }
            } catch (error) {
                return classifyRateResourceError(error)
            } finally {
                setIsMutating(false)
            }
        },
        [],
    )

    return { remove, isMutating }
}
