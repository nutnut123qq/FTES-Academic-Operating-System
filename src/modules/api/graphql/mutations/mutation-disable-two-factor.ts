import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { DisableTwoFactorRequest, MutateDisableTwoFactorResponse } from "./types/two-factor"

const mutation1 = gql`
  mutation DisableTwoFactor($request: DisableTwoFactorRequest!) {
    disableTwoFactor(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationDisableTwoFactor {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationDisableTwoFactor, DocumentNode> = {
    [MutationDisableTwoFactor.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateDisableTwoFactor}. */
export type MutateDisableTwoFactorParams = MutateParams<
    MutationDisableTwoFactor,
    DisableTwoFactorRequest
>

/**
 * Disables 2FA (requires a valid code while enabled) and clears the secret.
 *
 * Mirrors `disableTwoFactor` (mutations/two-factor/disable-two-factor/...).
 */
export const mutateDisableTwoFactor = async ({
    mutation = MutationDisableTwoFactor.Mutation1,
    request,
    debug,
    signal,
}: MutateDisableTwoFactorParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateDisableTwoFactorResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
