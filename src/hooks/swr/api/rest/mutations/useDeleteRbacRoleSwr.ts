import useSWRMutation from "swr/mutation"
import {
    deleteRbacRole,
    type RbacMessageResponseStub,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link deleteRbacRole}.
 */
export const useDeleteRbacRoleSwr = () => {
    const swr = useSWRMutation<
        RbacMessageResponseStub,
        Error,
        string,
        string
    >("DELETE_RBAC_ROLE_SWR", async (_key, { arg }) => {
        return deleteRbacRole(arg)
    })

    return swr
}
