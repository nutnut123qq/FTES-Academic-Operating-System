import useSWRMutation from "swr/mutation"
import { cancelOrder, type OrderView } from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link cancelOrder}.
 */
export const usePostCancelOrderSwr = () => {
    const swr = useSWRMutation<OrderView, Error, string, string>(
        "POST_CANCEL_ORDER_SWR",
        async (_key, { arg }) => {
            return cancelOrder(arg)
        },
    )

    return swr
}
