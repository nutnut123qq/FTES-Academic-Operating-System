import useSWRMutation from "swr/mutation"
import {
    revokeAllSecurityAdminUserSessions,
    type SecurityMessageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR mutation wrapper for {@link revokeAllSecurityAdminUserSessions}.
 */
export const useDeleteRevokeAllSecurityAdminUserSessionsSwr = () => {
    const swr = useSWRMutation<
        SecurityMessageResponse,
        Error,
        string,
        string
    >("DELETE_REVOKE_ALL_SECURITY_ADMIN_USER_SESSIONS_SWR", async (_key, { arg }) => {
        return revokeAllSecurityAdminUserSessions(arg)
    })

    return swr
}
