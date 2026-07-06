import useSWRMutation from "swr/mutation"
import {
    createResourceUploadUrl,
    type ResourceUploadUrlRequest,
    type ResourceUploadUrlResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link createResourceUploadUrl}.
 */
export const usePostCreateResourceUploadUrlSwr = () => {
    const swr = useSWRMutation<
        ResourceUploadUrlResponse,
        Error,
        string,
        { id: string; request: ResourceUploadUrlRequest }
    >(
        "POST_CREATE_RESOURCE_UPLOAD_URL_SWR",
        async (_key, { arg }) => {
            return createResourceUploadUrl(arg.id, arg.request)
        },
    )

    return swr
}
