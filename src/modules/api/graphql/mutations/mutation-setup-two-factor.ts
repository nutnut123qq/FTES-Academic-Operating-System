import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { MutateSetupTwoFactorResponse } from "./types/two-factor"

const mutation1 = gql`
  mutation SetupTwoFactor {
    setupTwoFactor {
      success
      message
      error
      data {
        secret
        otpauthUrl
      }
    }
  }
`

export enum MutationSetupTwoFactor {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSetupTwoFactor, DocumentNode> = {
    [MutationSetupTwoFactor.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSetupTwoFactor} (no variables → no `request`). */
export type MutateSetupTwoFactorParams = Omit<
    MutateParams<MutationSetupTwoFactor, undefined>,
    "request"
>

/**
 * Starts TOTP enrollment; returns the secret + otpauth URI for the QR code.
 *
 * Mirrors `setupTwoFactor` (mutations/two-factor/setup-two-factor/...).
 */
export const mutateSetupTwoFactor = async ({
    mutation = MutationSetupTwoFactor.Mutation1,
    debug,
    signal,
}: MutateSetupTwoFactorParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateSetupTwoFactorResponse>({
        mutation: mutationMap[mutation],
    })
}
