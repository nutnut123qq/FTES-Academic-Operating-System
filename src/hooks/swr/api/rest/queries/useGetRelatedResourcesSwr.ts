"use client"

import useSWR from "swr"
import {
    getRelatedResources,
    type ResourceSummary,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getRelatedResources}.
 */
export const useGetRelatedResourcesSwr = (id: string) => {
    const swr = useSWR<Array<ResourceSummary>, Error>(
        ["GET_RELATED_RESOURCES_SWR", id],
        () => getRelatedResources(id),
    )

    return swr
}
