import useSWRMutation from "swr/mutation"
import { uploadCover, type SelfProfile } from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link uploadCover}.
 */
export const usePostUploadCoverSwr = () => {
    const swr = useSWRMutation<SelfProfile, Error, string, File>(
        "POST_UPLOAD_COVER_SWR",
        async (_key, { arg }) => {
            return uploadCover(arg)
        },
    )

    return swr
}
