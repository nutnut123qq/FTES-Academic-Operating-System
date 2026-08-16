import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { PurchaseAiSubscriptionRequest, MutatePurchaseAiSubscriptionResponse } from "./types/purchase-ai-subscription"

const mutation1 = gql`
  mutation PurchaseAiSubscription($request: PurchaseAiSubscriptionRequest!) {
    purchaseAiSubscription(request: $request) {
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

export enum MutationPurchaseAiSubscription {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationPurchaseAiSubscription, DocumentNode> = {
    [MutationPurchaseAiSubscription.Mutation1]: mutation1,
}

/** Apollo params for {@link mutatePurchaseAiSubscription}. */
export type MutatePurchaseAiSubscriptionParams = MutateParams<
    MutationPurchaseAiSubscription,
    PurchaseAiSubscriptionRequest
>

/**
 * Opens checkout for an AI subscription tier. Same machinery as the course purchase
 * (cart → order → VietQR → bank webhook → fulfillment), so the answer is a **VietQR
 * payload + the order id to poll**, not a gateway URL — `checkoutUrl` /
 * `checkoutFields` are always null server-side and are not selected.
 *
 * Pressing twice is safe: an open, unexpired order for the same (viewer, product) is
 * returned again instead of a second order being created.
 *
 * Mirrors backend `purchaseAiSubscription` (`SubscriptionCommerceController`).
 */
export const mutatePurchaseAiSubscription = async ({
    mutation = MutationPurchaseAiSubscription.Mutation1,
    request,
    debug,
    signal,
}: MutatePurchaseAiSubscriptionParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutatePurchaseAiSubscriptionResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
