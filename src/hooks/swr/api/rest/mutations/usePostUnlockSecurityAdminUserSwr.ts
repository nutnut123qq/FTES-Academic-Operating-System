import useSWRMutation from "swr/mutation"
import {
    unlockSecurityAdminUser,
    type SecurityMessageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR mutation wrapper for {@link unlockSecurityAdminUser}.
 */
export const usePostUnlockSecurityAdminUserSwr = () => {
    const swr = useSWRMutation<
        SecurityMessageResponse,
        Error,
        string,
        string
    >("POST_UNLOCK_SECURITY_ADMIN_USER_SWR", async (_key, { arg }) => {
        return unlockSecurityAdminUser(arg)
    })

    return swr
}
