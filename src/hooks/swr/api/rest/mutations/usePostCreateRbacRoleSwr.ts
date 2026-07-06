import useSWRMutation from "swr/mutation"
import {
    createRbacRole,
    type RbacCreateRoleRequest,
    type RbacRoleView,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link createRbacRole}.
 */
export const usePostCreateRbacRoleSwr = () => {
    const swr = useSWRMutation<
        RbacRoleView,
        Error,
        string,
        RbacCreateRoleRequest
    >("POST_CREATE_RBAC_ROLE_SWR", async (_key, { arg }) => {
        return createRbacRole(arg)
    })

    return swr
}
