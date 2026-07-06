import useSWRMutation from "swr/mutation"
import {
    requestRefund,
    type RefundCreateRequest,
    type RefundRequestView,
} from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link requestRefund}.
 */
export const usePostRequestRefundSwr = () => {
    const swr = useSWRMutation<
        RefundRequestView,
        Error,
        string,
        { orderId: string; request: RefundCreateRequest }
    >(
        "POST_REQUEST_REFUND_SWR",
        async (_key, { arg }) => {
            return requestRefund(arg.orderId, arg.request)
        },
    )

    return swr
}
