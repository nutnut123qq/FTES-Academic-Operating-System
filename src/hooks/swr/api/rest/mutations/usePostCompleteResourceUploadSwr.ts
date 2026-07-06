import useSWRMutation from "swr/mutation"
import {
    completeResourceUpload,
    type CompleteUploadRequest,
    type VersionResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link completeResourceUpload}.
 */
export const usePostCompleteResourceUploadSwr = () => {
    const swr = useSWRMutation<
        VersionResponse,
        Error,
        string,
        { versionId: string; request: CompleteUploadRequest }
    >(
        "POST_COMPLETE_RESOURCE_UPLOAD_SWR",
        async (_key, { arg }) => {
            return completeResourceUpload(arg.versionId, arg.request)
        },
    )

    return swr
}
