"use client"

import useSWR from "swr"
import {
    getResourceDetail,
    type ResourceResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getResourceDetail}.
 */
export const useGetResourceDetailSwr = (id: string) => {
    const swr = useSWR<ResourceResponse, Error>(
        ["GET_RESOURCE_DETAIL_SWR", id],
        () => getResourceDetail(id),
    )

    return swr
}
