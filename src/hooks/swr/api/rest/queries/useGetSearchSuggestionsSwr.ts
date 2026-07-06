"use client"

import useSWR from "swr"
import {
    suggest,
    type SuggestRequest,
    type SuggestResponse,
} from "@/modules/api/rest/search"

/**
 * SWR query wrapper for {@link suggest}.
 */
export const useGetSearchSuggestionsSwr = (request: SuggestRequest) => {
    const swr = useSWR<SuggestResponse, Error>(
        ["GET_SEARCH_SUGGESTIONS_SWR", request],
        () => suggest(request),
    )

    return swr
}
