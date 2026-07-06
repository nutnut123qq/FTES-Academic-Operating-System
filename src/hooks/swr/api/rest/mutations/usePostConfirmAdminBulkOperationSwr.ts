import useSWRMutation from "swr/mutation"
import {
    confirmAdminBulkOperation,
    type AdminBulkConfirmRequest,
    type AdminBulkOperation,
} from "@/modules/api/rest/admin"

/**
 * SWR mutation wrapper for {@link confirmAdminBulkOperation}.
 */
export const usePostConfirmAdminBulkOperationSwr = () => {
    const swr = useSWRMutation<
        AdminBulkOperation,
        Error,
        string,
        { bulkId: string; request: AdminBulkConfirmRequest }
    >("POST_CONFIRM_ADMIN_BULK_OPERATION_SWR", async (_key, { arg }) => {
        return confirmAdminBulkOperation(arg.bulkId, arg.request)
    })

    return swr
}
