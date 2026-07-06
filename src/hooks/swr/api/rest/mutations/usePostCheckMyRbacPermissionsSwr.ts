import useSWRMutation from "swr/mutation"
import {
    checkMyRbacPermissions,
    type RbacCheckRequest,
    type RbacCheckResponse,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR mutation wrapper for {@link checkMyRbacPermissions}.
 */
export const usePostCheckMyRbacPermissionsSwr = () => {
    const swr = useSWRMutation<
        RbacCheckResponse,
        Error,
        string,
        RbacCheckRequest
    >("POST_CHECK_MY_RBAC_PERMISSIONS_SWR", async (_key, { arg }) => {
        return checkMyRbacPermissions(arg)
    })

    return swr
}
