import useSWRMutation from "swr/mutation"
import { revokeSession } from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link revokeSession}.
 */
export const usePostRevokeSessionSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_REVOKE_SESSION_SWR",
        async (_key, { arg }) => {
            return revokeSession(arg)
        },
    )

    return swr
}
