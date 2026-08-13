"use client"

import useSWR from "swr"
import {
    getLatestGoldenBoard,
    type GoldenBoardView,
} from "@/modules/api/rest/course"

/**
 * SWR wrapper for {@link getLatestGoldenBoard} — the bảng vàng of the LATEST term.
 *
 * PUBLIC read: the BE serves `/golden-board/**` to anonymous callers, and the REST function
 * sends `authenticated: false`, so this resolves for a logged-out visitor on the home page.
 *
 * An empty board is a SUCCESS, not an error: the BE answers 200 with `{term: null, entries: []}`
 * when no term has a board yet. Callers should branch on `data.entries.length`, never on `error`.
 *
 * @param enabled - Pass `false` to hold the request (key `null`) — used by `/goldenboard`, which
 *   only needs the "latest" board while the URL carries no explicit `?term=`.
 */
export const useGetGoldenBoardLatestSwr = (enabled = true) => {
    const swr = useSWR<GoldenBoardView, Error>(
        enabled ? ["GET_GOLDEN_BOARD_LATEST_SWR"] : null,
        () => getLatestGoldenBoard(),
    )

    return swr
}
