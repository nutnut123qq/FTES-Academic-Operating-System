import useSWRMutation from "swr/mutation"
import {
    bulkLockAdminUsers,
    type AdminBulkBodyRequest,
    type AdminBulkDryRunResult,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link bulkLockAdminUsers}.
 */
export const usePostBulkLockAdminUsersSwr = () => {
    const swr = useSWRMutation<
        AdminBulkDryRunResult,
        Error,
        string,
        AdminBulkBodyRequest
    >("POST_BULK_LOCK_ADMIN_USERS_SWR", async (_key, { arg }) => {
        return bulkLockAdminUsers(arg)
    })

    return swr
}
