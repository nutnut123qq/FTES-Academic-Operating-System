import useSWRMutation from "swr/mutation"
import {
    updateRbacRole,
    type RbacRoleView,
    type RbacUpdateRoleRequest,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link updateRbacRole}.
 */
export const usePatchUpdateRbacRoleSwr = () => {
    const swr = useSWRMutation<
        RbacRoleView,
        Error,
        string,
        { id: string; request: RbacUpdateRoleRequest }
    >("PATCH_UPDATE_RBAC_ROLE_SWR", async (_key, { arg }) => {
        return updateRbacRole(arg.id, arg.request)
    })

    return swr
}
