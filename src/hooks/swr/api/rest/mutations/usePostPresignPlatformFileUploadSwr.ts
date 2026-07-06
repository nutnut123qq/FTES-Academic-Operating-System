import useSWRMutation from "swr/mutation"
import {
    presignPlatformFileUpload,
    type PlatformPresignUploadRequest,
    type PlatformPresignUploadResult,
} from "@/modules/api/rest/platform"

/**
 * SWR mutation wrapper for {@link presignPlatformFileUpload}.
 */
export const usePostPresignPlatformFileUploadSwr = () => {
    const swr = useSWRMutation<
        PlatformPresignUploadResult,
        Error,
        string,
        PlatformPresignUploadRequest
    >("POST_PRESIGN_PLATFORM_FILE_UPLOAD_SWR", async (_key, { arg }) => {
        return presignPlatformFileUpload(arg)
    })

    return swr
}
