import useSWRMutation from "swr/mutation"
import {
    lockSecurityAdminUser,
    type SecurityLockRequest,
    type SecurityMessageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR mutation wrapper for {@link lockSecurityAdminUser}.
 */
export const usePostLockSecurityAdminUserSwr = () => {
    const swr = useSWRMutation<
        SecurityMessageResponse,
        Error,
        string,
        { userId: string; request: SecurityLockRequest }
    >("POST_LOCK_SECURITY_ADMIN_USER_SWR", async (_key, { arg }) => {
        return lockSecurityAdminUser(arg.userId, arg.request)
    })

    return swr
}
