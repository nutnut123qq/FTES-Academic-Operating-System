import useSWRMutation from "swr/mutation"
import {
    completePlatformFileUpload,
    type PlatformCompleteFileUploadRequest,
    type PlatformFileObject,
} from "@/modules/api/rest/platform"

/**
 * SWR mutation wrapper for {@link completePlatformFileUpload}.
 */
export const usePostCompletePlatformFileUploadSwr = () => {
    const swr = useSWRMutation<
        PlatformFileObject,
        Error,
        string,
        { fileId: string; request: PlatformCompleteFileUploadRequest }
    >("POST_COMPLETE_PLATFORM_FILE_UPLOAD_SWR", async (_key, { arg }) => {
        return completePlatformFileUpload(arg.fileId, arg.request)
    })

    return swr
}
