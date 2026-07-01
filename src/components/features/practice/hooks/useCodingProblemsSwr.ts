"use client"

import useSWR from "swr"
import { PROBLEMS_PAGE_LIMIT } from "../constants"
import { queryCodingProblems } from "@/modules/api/graphql/queries/query-coding-problems"
import { type CodingProblem } from "@/modules/api/graphql/queries/types/coding"

/**
 * SWR hook loading the full coding-problem catalog in one page. Phase 1 filters,
 * searches, and sorts CLIENT-side, so the request carries no facets — the backend
 * only supports difficulty + single-tag server filters, which we do not use here.
 * Returns the problem array (or null while empty).
 *
 * @returns the SWR handle (data = `Array<CodingProblem>` or null).
 */
export const useCodingProblemsSwr = () => {
    return useSWR(
        ["PRACTICE_CODING_PROBLEMS_SWR"],
        async (): Promise<Array<CodingProblem> | null> => {
            const response = await queryCodingProblems({
                request: { page: 1, limit: PROBLEMS_PAGE_LIMIT },
            })
            return response.data?.codingProblems.data?.problems ?? null
        },
    )
}
