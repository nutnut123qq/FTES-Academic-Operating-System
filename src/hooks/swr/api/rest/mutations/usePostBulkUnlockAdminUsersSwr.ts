import useSWRMutation from "swr/mutation"
import {
    bulkUnlockAdminUsers,
    type AdminBulkBodyRequest,
    type AdminBulkDryRunResult,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link bulkUnlockAdminUsers}.
 */
export const usePostBulkUnlockAdminUsersSwr = () => {
    const swr = useSWRMutation<
        AdminBulkDryRunResult,
        Error,
        string,
        AdminBulkBodyRequest
    >("POST_BULK_UNLOCK_ADMIN_USERS_SWR", async (_key, { arg }) => {
        return bulkUnlockAdminUsers(arg)
    })

    return swr
}
