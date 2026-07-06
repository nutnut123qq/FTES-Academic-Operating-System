import useSWRMutation from "swr/mutation"
import { putGoal, type GoalUpdate, type GoalView } from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link putGoal}.
 */
export const usePostPutGoalSwr = () => {
    const swr = useSWRMutation<GoalView, Error, string, GoalUpdate>(
        "POST_PUT_GOAL_SWR",
        async (_key, { arg }) => {
            return putGoal(arg)
        },
    )

    return swr
}
