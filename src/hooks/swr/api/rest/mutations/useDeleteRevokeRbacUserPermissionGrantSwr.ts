import useSWRMutation from "swr/mutation"
import {
    revokeRbacUserPermissionGrant,
    type RbacMessageResponseStub,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link revokeRbacUserPermissionGrant}.
 */
export const useDeleteRevokeRbacUserPermissionGrantSwr = () => {
    const swr = useSWRMutation<
        RbacMessageResponseStub,
        Error,
        string,
        { userId: string; grantId: string }
    >("DELETE_REVOKE_RBAC_USER_PERMISSION_GRANT_SWR", async (_key, { arg }) => {
        return revokeRbacUserPermissionGrant(arg.userId, arg.grantId)
    })

    return swr
}
