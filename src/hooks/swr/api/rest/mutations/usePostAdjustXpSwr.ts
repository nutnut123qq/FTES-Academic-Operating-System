import useSWRMutation from "swr/mutation"
import {
    adjustXp,
    type XpAdjustRequest,
} from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link adjustXp}.
 */
export const usePostAdjustXpSwr = () => {
    const swr = useSWRMutation<number, Error, string, XpAdjustRequest>(
        "POST_ADJUST_XP_SWR",
        async (_key, { arg }) => {
            return adjustXp(arg)
        },
    )

    return swr
}
