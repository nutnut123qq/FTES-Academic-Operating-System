"use client"

import useSWR from "swr"
import {
    getMyCollections,
    type CollectionResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getMyCollections}.
 */
export const useGetMyCollectionsSwr = (params?: {
    page?: number
    size?: number
}) => {
    const swr = useSWR<Array<CollectionResponse>, Error>(
        ["GET_MY_COLLECTIONS_SWR", params?.page, params?.size],
        () => getMyCollections(params),
    )

    return swr
}
