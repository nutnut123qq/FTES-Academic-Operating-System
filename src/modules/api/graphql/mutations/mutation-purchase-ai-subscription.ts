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
        checkoutUrl
        referenceId
        transactionId
        amount
        checkoutFields
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
 * Starts AI subscription checkout (PayOS / Sepay): creates a pending transaction
 * and returns the checkout URL.
 *
 * Mirrors backend `purchaseAiSubscription` (mutations/ai/purchase-ai-subscription).
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
