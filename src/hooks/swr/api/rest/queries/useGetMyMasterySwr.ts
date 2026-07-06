"use client"

import useSWR from "swr"
import { getMyMastery, type MasteryView } from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link getMyMastery}.
 */
export const useGetMyMasterySwr = () => {
    const swr = useSWR<Array<MasteryView>, Error>(["GET_MY_MASTERY_SWR"], () =>
        getMyMastery(),
    )

    return swr
}
