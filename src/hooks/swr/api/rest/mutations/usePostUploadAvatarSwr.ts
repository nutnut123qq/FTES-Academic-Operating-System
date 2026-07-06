import useSWRMutation from "swr/mutation"
import { uploadAvatar, type SelfProfile } from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link uploadAvatar}.
 */
export const usePostUploadAvatarSwr = () => {
    const swr = useSWRMutation<SelfProfile, Error, string, File>(
        "POST_UPLOAD_AVATAR_SWR",
        async (_key, { arg }) => {
            return uploadAvatar(arg)
        },
    )

    return swr
}
