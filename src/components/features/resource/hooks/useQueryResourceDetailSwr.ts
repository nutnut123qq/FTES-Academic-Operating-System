"use client"

import useSWR from "swr"
import { getResourceDetail, type ResourceResponse } from "@/modules/api/rest/resource"

/**
 * Loads a resource's detail from the REST backend (`GET /api/v1/resources/{id}`).
 *
 * The endpoint is PUBLIC (visibility-gated server-side), so a guest can read a
 * public resource; a private/soft-deleted one answers 403/404 and the caller
 * renders the error state (and hides the AI-QA section).
 *
 * The SWR key mirrors the central `useGetResourceDetailSwr` wrapper so both share
 * one cache entry (a `mutate` here also refreshes any other consumer).
 *
 * @param resourceId - Resource id from the route.
 * @returns `{ resource, isLoading, error, mutate }` — `resource` is the raw
 * {@link ResourceResponse} (title / type / avgRating / ratingCount / currentVersionId).
 */
export const useQueryResourceDetailSwr = (resourceId: string) => {
    const { data, isLoading, error, mutate } = useSWR<ResourceResponse, Error>(
        resourceId ? ["GET_RESOURCE_DETAIL_SWR", resourceId] : null,
        () => getResourceDetail(resourceId),
    )
    return { resource: data, isLoading, error, mutate }
}
