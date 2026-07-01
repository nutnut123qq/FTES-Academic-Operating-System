import useSWRMutation from "swr/mutation"
import { mutatePurchaseMembership } from "@/modules/api/graphql/mutations/mutation-purchase-membership"
import { type PurchaseMembershipRequest } from "@/modules/api/graphql/mutations/types/purchase-membership"

type MutatePurchaseMembershipResult = Awaited<ReturnType<typeof mutatePurchaseMembership>>

/**
 * SWR mutation wrapper for {@link mutatePurchaseMembership} (Bearer from Keycloak).
 */
export const useMutatePurchaseMembershipSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutatePurchaseMembershipResult,
        Error,
        string,
        PurchaseMembershipRequest
    >(
        "MUTATE_PURCHASE_MEMBERSHIP_SWR",
        async (_key, { arg }) => {
            return mutatePurchaseMembership({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
