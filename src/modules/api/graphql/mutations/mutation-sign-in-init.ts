import type { MutateParams } from "../types"
import { createNoAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SignInInitRequest, MutateSignInInitResponse } from "./types/sign-in-init"

const mutation1 = gql`
  mutation SignInInit($request: SignInInitRequest!) {
    signInInit(request: $request) {
      success
      message
      error
      data {
        challengeId
        expiresInSeconds
      }
    }
  }
`

export enum MutationSignInInit {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSignInInit, DocumentNode> = {
    [MutationSignInInit.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSignInInit}. */
export type MutateSignInInitParams = MutateParams<MutationSignInInit, SignInInitRequest>

/**
 * Sign-in init: verifies username/password, then sends OTP to email.
 */
export const mutateSignInInit = async ({
    mutation = MutationSignInInit.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSignInInitParams) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
        withCredentials: true,
    })
    return apollo.mutate<MutateSignInInitResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
