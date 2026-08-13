"use client"

import useSWR from "swr"
import {
    getGoldenBoardTerms,
    type GoldenBoardTermOptionView,
} from "@/modules/api/rest/course"

/**
 * SWR wrapper for {@link getGoldenBoardTerms} — the terms that HAVE a bảng vàng, newest first,
 * each with its `entryCount`. Feeds the term picker on `/goldenboard`.
 *
 * PUBLIC read (anonymous-safe). No terms curated yet → an empty array on SUCCESS, not an error.
 */
export const useGetGoldenBoardTermsSwr = () => {
    const swr = useSWR<Array<GoldenBoardTermOptionView>, Error>(
        ["GET_GOLDEN_BOARD_TERMS_SWR"],
        () => getGoldenBoardTerms(),
    )

    return swr
}
