import useSWRMutation from "swr/mutation"
import {
    replaceRbacRolePermissions,
    type RbacReplacePermissionsRequest,
    type RbacRoleView,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link replaceRbacRolePermissions}.
 */
export const usePutReplaceRbacRolePermissionsSwr = () => {
    const swr = useSWRMutation<
        RbacRoleView,
        Error,
        string,
        { id: string; request: RbacReplacePermissionsRequest }
    >("PUT_REPLACE_RBAC_ROLE_PERMISSIONS_SWR", async (_key, { arg }) => {
        return replaceRbacRolePermissions(arg.id, arg.request)
    })

    return swr
}
