import useSWRMutation from "swr/mutation"
import {
    replayActivities,
    type ActivityReplayRequest,
    type ActivityReplayResult,
} from "@/modules/api/rest/activity"

/**
 * SWR mutation wrapper for {@link replayActivities}.
 */
export const usePostReplayActivitiesSwr = () => {
    const swr = useSWRMutation<
        ActivityReplayResult,
        Error,
        string,
        ActivityReplayRequest
    >("POST_REPLAY_ACTIVITIES_SWR", async (_key, { arg }) => {
        return replayActivities(arg)
    })

    return swr
}
