import useSWRMutation from "swr/mutation"
import { closeSeason, type SeasonResponse } from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link closeSeason}.
 */
export const usePostCloseSeasonSwr = () => {
    const swr = useSWRMutation<SeasonResponse, Error, string, string>(
        "POST_CLOSE_SEASON_SWR",
        async (_key, { arg }) => {
            return closeSeason(arg)
        },
    )

    return swr
}
