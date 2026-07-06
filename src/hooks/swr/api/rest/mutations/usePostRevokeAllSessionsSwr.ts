import useSWRMutation from "swr/mutation"
import { revokeAllSessions } from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link revokeAllSessions}.
 */
export const usePostRevokeAllSessionsSwr = () => {
    const swr = useSWRMutation<void, Error, string, boolean | undefined>(
        "POST_REVOKE_ALL_SESSIONS_SWR",
        async (_key, { arg }) => {
            return revokeAllSessions(arg)
        },
    )

    return swr
}
