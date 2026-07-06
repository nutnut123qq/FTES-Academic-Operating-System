"use client"

import useSWR from "swr"
import { search, type SearchRequest, type SearchResponse } from "@/modules/api/rest/search"

/**
 * SWR query wrapper for {@link search}.
 */
export const useGetSearchSwr = (request: SearchRequest) => {
    const swr = useSWR<SearchResponse, Error>(
        ["GET_SEARCH_SWR", request],
        () => search(request),
    )

    return swr
}
