import useSWRMutation from "swr/mutation"
import {
    grantRbacPermissionToUser,
    type RbacGrantCreatedResponse,
    type RbacGrantPermissionRequest,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link grantRbacPermissionToUser}.
 */
export const usePostGrantRbacPermissionToUserSwr = () => {
    const swr = useSWRMutation<
        RbacGrantCreatedResponse,
        Error,
        string,
        { userId: string; request: RbacGrantPermissionRequest }
    >("POST_GRANT_RBAC_PERMISSION_TO_USER_SWR", async (_key, { arg }) => {
        return grantRbacPermissionToUser(arg.userId, arg.request)
    })

    return swr
}
