import useSWRMutation from "swr/mutation"
import {
    addAchievement,
    type ProfileAchievementRequest,
    type AchievementView,
} from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link addAchievement}.
 */
export const usePostAddAchievementSwr = () => {
    const swr = useSWRMutation<
        AchievementView,
        Error,
        string,
        ProfileAchievementRequest
    >("POST_ADD_ACHIEVEMENT_SWR", async (_key, { arg }) => {
        return addAchievement(arg)
    })

    return swr
}
