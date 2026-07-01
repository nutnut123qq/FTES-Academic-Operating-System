import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { RevokeSessionRequest, MutateRevokeSessionResponse } from "./types/revoke-session"

const mutation1 = gql`
  mutation RevokeSession($request: RevokeSessionRequest!) {
    revokeSession(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationRevokeSession {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationRevokeSession, DocumentNode> = {
    [MutationRevokeSession.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateRevokeSession}. */
export type MutateRevokeSessionParams = MutateParams<
    MutationRevokeSession,
    RevokeSessionRequest
>

/**
 * Revokes one of the current user's logged-in device sessions (logs it out).
 *
 * Mirrors `revokeSession` (mutations/keycloak/revoke-session/revoke-session.resolver.ts).
 */
export const mutateRevokeSession = async ({
    mutation = MutationRevokeSession.Mutation1,
    request,
    debug,
    signal,
}: MutateRevokeSessionParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateRevokeSessionResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
