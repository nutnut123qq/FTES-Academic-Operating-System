"use client"

import useSWR from "swr"
import {
    getCollectionDetail,
    type CollectionDetailResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getCollectionDetail}.
 */
export const useGetCollectionDetailSwr = (id: string) => {
    const swr = useSWR<CollectionDetailResponse, Error>(
        ["GET_COLLECTION_DETAIL_SWR", id],
        () => getCollectionDetail(id),
    )

    return swr
}
