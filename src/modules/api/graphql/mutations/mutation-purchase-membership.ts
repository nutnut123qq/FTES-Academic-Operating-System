import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { PurchaseMembershipRequest, MutatePurchaseMembershipResponse } from "./types/purchase-membership"

const mutation1 = gql`
  mutation PurchaseMembership($request: PurchaseMembershipRequest!) {
    purchaseMembership(request: $request) {
      success
      message
      error
      data {
        checkoutUrl
        referenceId
        transactionId
        amount
        checkoutFields
      }
    }
  }
`

export enum MutationPurchaseMembership {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationPurchaseMembership, DocumentNode> = {
    [MutationPurchaseMembership.Mutation1]: mutation1,
}

/** Apollo params for {@link mutatePurchaseMembership}. */
export type MutatePurchaseMembershipParams = MutateParams<
    MutationPurchaseMembership,
    PurchaseMembershipRequest
>

/**
 * Starts community-membership checkout (PayOS / Sepay / Stripe / PayPal /
 * Crypto): creates a pending transaction and returns the checkout URL.
 *
 * Mirrors backend `purchaseMembership` (mutations/membership/purchase-membership).
 */
export const mutatePurchaseMembership = async ({
    mutation = MutationPurchaseMembership.Mutation1,
    request,
    debug,
    signal,
}: MutatePurchaseMembershipParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutatePurchaseMembershipResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
