import useSWRMutation from "swr/mutation"
import {
    patchAdminBanner,
    type AdminBanner,
    type AdminPatchBannerRequest,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link patchAdminBanner}.
 */
export const usePatchAdminBannerSwr = () => {
    const swr = useSWRMutation<
        AdminBanner,
        Error,
        string,
        { id: string; request: AdminPatchBannerRequest }
    >("PATCH_ADMIN_BANNER_SWR", async (_key, { arg }) => {
        return patchAdminBanner(arg.id, arg.request)
    })

    return swr
}
