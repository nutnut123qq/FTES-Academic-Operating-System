import useSWRMutation from "swr/mutation"
import {
    createAdminBanner,
    type AdminBanner,
    type AdminCreateBannerRequest,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link createAdminBanner}.
 */
export const usePostCreateAdminBannerSwr = () => {
    const swr = useSWRMutation<
        AdminBanner,
        Error,
        string,
        AdminCreateBannerRequest
    >("POST_CREATE_ADMIN_BANNER_SWR", async (_key, { arg }) => {
        return createAdminBanner(arg)
    })

    return swr
}
