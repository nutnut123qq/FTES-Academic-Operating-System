import useSWRMutation from "swr/mutation"
import {
    moderateProfile,
    type ProfileUpdateRequest,
} from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link moderateProfile}.
 */
export const usePostModerateProfileSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { userId: string; request: ProfileUpdateRequest }
    >("POST_MODERATE_PROFILE_SWR", async (_key, { arg }) => {
        return moderateProfile(arg.userId, arg.request)
    })

    return swr
}
