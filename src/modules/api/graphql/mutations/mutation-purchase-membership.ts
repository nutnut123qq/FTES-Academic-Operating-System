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
        referenceId
        transactionId
        amount
        qrCode
        orderStatus
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
 * Opens checkout for the community membership. The backend delegates to the SAME
 * commerce checkout a course purchase runs (cart → order → VietQR → bank webhook →
 * fulfillment), so the answer is a **VietQR payload + the order id to poll**, not a
 * gateway URL — `checkoutUrl` / `checkoutFields` exist in the schema but are documented
 * as always null, and are therefore not selected.
 *
 * Pressing twice is safe: an open, unexpired order for the same (viewer, product) is
 * returned again instead of a second order being created.
 *
 * Mirrors backend `purchaseMembership` (`SubscriptionCommerceController`).
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
