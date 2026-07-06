import useSWRMutation from "swr/mutation"
import { useStreakFreeze } from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link useStreakFreeze}.
 */
export const usePostUseStreakFreezeSwr = () => {
    const swr = useSWRMutation<void, Error, string>(
        "POST_USE_STREAK_FREEZE_SWR",
        async () => {
            return useStreakFreeze()
        },
    )

    return swr
}
