import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ConfirmTwoFactorRequest, MutateConfirmTwoFactorResponse } from "./types/two-factor"

const mutation1 = gql`
  mutation ConfirmTwoFactor($request: ConfirmTwoFactorRequest!) {
    confirmTwoFactor(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationConfirmTwoFactor {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationConfirmTwoFactor, DocumentNode> = {
    [MutationConfirmTwoFactor.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateConfirmTwoFactor}. */
export type MutateConfirmTwoFactorParams = MutateParams<
    MutationConfirmTwoFactor,
    ConfirmTwoFactorRequest
>

/**
 * Confirms TOTP setup by verifying a code, enabling 2FA.
 *
 * Mirrors `confirmTwoFactor` (mutations/two-factor/confirm-two-factor/...).
 */
export const mutateConfirmTwoFactor = async ({
    mutation = MutationConfirmTwoFactor.Mutation1,
    request,
    debug,
    signal,
}: MutateConfirmTwoFactorParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateConfirmTwoFactorResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
