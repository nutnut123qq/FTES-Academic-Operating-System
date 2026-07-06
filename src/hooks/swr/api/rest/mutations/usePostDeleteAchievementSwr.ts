import useSWRMutation from "swr/mutation"
import { deleteAchievement } from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link deleteAchievement}.
 */
export const usePostDeleteAchievementSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_ACHIEVEMENT_SWR",
        async (_key, { arg }) => {
            return deleteAchievement(arg)
        },
    )

    return swr
}
