import useSWRMutation from "swr/mutation"
import {
    deleteAdminBanner,
    type AdminDeleteBannerRequest,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link deleteAdminBanner}.
 */
export const useDeleteAdminBannerSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; request: AdminDeleteBannerRequest }
    >("DELETE_ADMIN_BANNER_SWR", async (_key, { arg }) => {
        return deleteAdminBanner(arg.id, arg.request)
    })

    return swr
}
