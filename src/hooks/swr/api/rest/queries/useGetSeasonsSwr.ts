"use client"

import useSWR from "swr"
import { listSeasons, type SeasonResponse } from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link listSeasons}.
 */
export const useGetSeasonsSwr = () => {
    const swr = useSWR<Array<SeasonResponse>, Error>(["GET_SEASONS_SWR"], () =>
        listSeasons(),
    )

    return swr
}
