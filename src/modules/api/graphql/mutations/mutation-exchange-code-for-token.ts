import type { MutateParams } from "../types"
import { createNoAuthApolloClient } from "../clients/clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ExchangeCodeForTokenRequest, MutateExchangeCodeForTokenResponse } from "./types/exchange-code-for-token"

const mutation1 = gql`
  mutation ExchangeCodeForToken($request: ExchangeCodeForTokenRequest!) {
    exchangeCodeForToken(request: $request) {
      success
      message
      error
      data {
        accessToken
      }
    }
  }
`

export enum MutationExchangeCodeForToken {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationExchangeCodeForToken, DocumentNode> = {
    [MutationExchangeCodeForToken.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateExchangeCodeForToken}. */
export type MutateExchangeCodeForTokenParams = MutateParams<
    MutationExchangeCodeForToken,
    ExchangeCodeForTokenRequest
>

/**
 * Exchanges an OIDC authorization code for Keycloak tokens (public; used after IdP redirect).
 *
 * Mirrors `src/keycloak/exchangeCodeForToken/exchange-code-for-token.resolver.ts` (`exchangeCodeForToken`).
 */
export const mutateExchangeCodeForToken = async ({
    mutation = MutationExchangeCodeForToken.Mutation1,
    request,
    debug,
    signal,
}: MutateExchangeCodeForTokenParams) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
        withCredentials: true,
    })
    return apollo.mutate<MutateExchangeCodeForTokenResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
