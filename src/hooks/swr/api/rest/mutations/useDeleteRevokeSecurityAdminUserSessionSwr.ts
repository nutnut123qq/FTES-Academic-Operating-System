import useSWRMutation from "swr/mutation"
import {
    revokeSecurityAdminUserSession,
    type SecurityMessageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR mutation wrapper for {@link revokeSecurityAdminUserSession}.
 */
export const useDeleteRevokeSecurityAdminUserSessionSwr = () => {
    const swr = useSWRMutation<
        SecurityMessageResponse,
        Error,
        string,
        { userId: string; sid: string }
    >("DELETE_REVOKE_SECURITY_ADMIN_USER_SESSION_SWR", async (_key, { arg }) => {
        return revokeSecurityAdminUserSession(arg.userId, arg.sid)
    })

    return swr
}
