"use client"

import useSWR from "swr"
import {
    getGoldenBoardForTerm,
    type GoldenBoardView,
} from "@/modules/api/rest/course"

/**
 * SWR wrapper for {@link getGoldenBoardForTerm} — one term's bảng vàng. Gated on
 * `termIdOrCode`, which the BE accepts as either the term id or its readable code (`"SP26"`),
 * so a shared `/goldenboard?term=SP26` link resolves.
 *
 * PUBLIC read (anonymous-safe). Two different outcomes worth branching on:
 *  - term exists but has no rows → SUCCESS with `entries: []`;
 *  - term does not exist at all → `error` (`TERM_NOT_FOUND`), i.e. a bad `?term=` in the URL.
 *
 * @param termIdOrCode - Term id or code; `undefined`/`null`/empty holds the request (key `null`).
 */
export const useGetGoldenBoardForTermSwr = (termIdOrCode?: string | null) => {
    const swr = useSWR<GoldenBoardView, Error>(
        termIdOrCode ? ["GET_GOLDEN_BOARD_FOR_TERM_SWR", termIdOrCode] : null,
        () => {
            if (!termIdOrCode) {
                throw new Error("termIdOrCode is required")
            }
            return getGoldenBoardForTerm(termIdOrCode)
        },
    )

    return swr
}
