import useSWRMutation from "swr/mutation"
import {
    grantRbacRoleToUser,
    type RbacGrantCreatedResponse,
    type RbacGrantRoleRequest,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link grantRbacRoleToUser}.
 */
export const usePostGrantRbacRoleToUserSwr = () => {
    const swr = useSWRMutation<
        RbacGrantCreatedResponse,
        Error,
        string,
        { userId: string; request: RbacGrantRoleRequest }
    >("POST_GRANT_RBAC_ROLE_TO_USER_SWR", async (_key, { arg }) => {
        return grantRbacRoleToUser(arg.userId, arg.request)
    })

    return swr
}
