import useSWRMutation from "swr/mutation"
import {
    checkout,
    type CheckoutRequest,
    type CheckoutResult,
} from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link checkout}.
 */
export const usePostCheckoutSwr = () => {
    const swr = useSWRMutation<
        CheckoutResult,
        Error,
        string,
        CheckoutRequest
    >(
        "POST_CHECKOUT_SWR",
        async (_key, { arg }) => {
            return checkout(arg)
        },
    )

    return swr
}
