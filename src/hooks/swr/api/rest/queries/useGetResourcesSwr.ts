"use client"

import useSWR from "swr"
import {
    listResources,
    type ResourcePageResponse,
    type ResourceSummary,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link listResources}.
 */
export const useGetResourcesSwr = (params?: {
    subjectId?: string | null
    type?: string | null
    minRating?: number | null
    license?: string | null
    q?: string | null
    sort?: string | null
    page?: number
    size?: number
}) => {
    const swr = useSWR<ResourcePageResponse<ResourceSummary>, Error>(
        [
            "GET_RESOURCES_SWR",
            params?.subjectId,
            params?.type,
            params?.minRating,
            params?.license,
            params?.q,
            params?.sort,
            params?.page,
            params?.size,
        ],
        () => listResources(params),
    )

    return swr
}
