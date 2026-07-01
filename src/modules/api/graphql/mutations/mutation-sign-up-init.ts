import type { MutateParams } from "../types"
import { createNoAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SignUpInitRequest, MutateSignUpInitResponse } from "./types/sign-up-init"

const mutation1 = gql`
  mutation SignUpInit($request: SignUpInitRequest!) {
    signUpInit(request: $request) {
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

export enum MutationSignUpInit {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSignUpInit, DocumentNode> = {
    [MutationSignUpInit.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSignUpInit}. */
export type MutateSignUpInitParams = MutateParams<MutationSignUpInit, SignUpInitRequest>

/**
 * Sign-up init: creates Keycloak user and sends OTP to email (`signUpInit` mutation).
 */
export const mutateSignUpInit = async ({
    mutation = MutationSignUpInit.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSignUpInitParams) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
        withCredentials: true,
    })
    return apollo.mutate<MutateSignUpInitResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
