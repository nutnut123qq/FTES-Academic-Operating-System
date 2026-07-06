import useSWRMutation from "swr/mutation"
import {
    createSeason,
    type SeasonRequest,
    type SeasonResponse,
} from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link createSeason}.
 */
export const usePostCreateSeasonSwr = () => {
    const swr = useSWRMutation<SeasonResponse, Error, string, SeasonRequest>(
        "POST_CREATE_SEASON_SWR",
        async (_key, { arg }) => {
            return createSeason(arg)
        },
    )

    return swr
}
