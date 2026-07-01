import useSWRMutation from "swr/mutation"
import { mutateRevokeSession } from "@/modules/api/graphql/mutations/mutation-revoke-session"
import { type RevokeSessionRequest } from "@/modules/api/graphql/mutations/types/revoke-session"

type MutateRevokeSessionResult = Awaited<ReturnType<typeof mutateRevokeSession>>

/**
 * SWR mutation wrapper for {@link mutateRevokeSession} (Bearer from Keycloak).
 */
export const useMutateRevokeSessionSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateRevokeSessionResult,
        Error,
        string,
        RevokeSessionRequest
    >(
        "MUTATE_REVOKE_SESSION_SWR",
        async (_key, { arg }) => {
            return mutateRevokeSession({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
