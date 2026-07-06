import useSWRMutation from "swr/mutation"
import {
    revokeRbacUserRoleGrant,
    type RbacMessageResponseStub,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link revokeRbacUserRoleGrant}.
 */
export const useDeleteRevokeRbacUserRoleGrantSwr = () => {
    const swr = useSWRMutation<
        RbacMessageResponseStub,
        Error,
        string,
        { userId: string; grantId: string }
    >("DELETE_REVOKE_RBAC_USER_ROLE_GRANT_SWR", async (_key, { arg }) => {
        return revokeRbacUserRoleGrant(arg.userId, arg.grantId)
    })

    return swr
}
