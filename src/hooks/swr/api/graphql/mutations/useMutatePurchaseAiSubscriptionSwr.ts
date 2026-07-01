import useSWRMutation from "swr/mutation"
import { mutatePurchaseAiSubscription } from "@/modules/api/graphql/mutations/mutation-purchase-ai-subscription"
import { type PurchaseAiSubscriptionRequest } from "@/modules/api/graphql/mutations/types/purchase-ai-subscription"

type MutatePurchaseAiSubscriptionResult = Awaited<ReturnType<typeof mutatePurchaseAiSubscription>>

/**
 * SWR mutation wrapper for {@link mutatePurchaseAiSubscription} (Bearer from Keycloak).
 */
export const useMutatePurchaseAiSubscriptionSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutatePurchaseAiSubscriptionResult,
        Error,
        string,
        PurchaseAiSubscriptionRequest
    >(
        "MUTATE_PURCHASE_AI_SUBSCRIPTION_SWR",
        async (_key, { arg }) => {
            return mutatePurchaseAiSubscription({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
