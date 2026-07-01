import useSWRMutation from "swr/mutation"
import { adminPresignedUrl, type AdminPresignedUrlParams } from "@/modules/api/rest/admin-presigned-url/presigned-url"
import { type AdminPresignedUrlResponse } from "@/modules/api/rest/admin-presigned-url/types"

/**
 * SWR mutation wrapper for {@link adminPresignedUrl}.
 */
export const usePostAdminPresignedUrlSwr = () => {
    const swr = useSWRMutation<
        AdminPresignedUrlResponse,
        Error,
        string,
        AdminPresignedUrlParams
    >(
        "POST_ADMIN_PRESIGNED_URL_SWR",
        async (_key, { arg }) => {
            return adminPresignedUrl(arg)
        }
    )
    return swr
}
