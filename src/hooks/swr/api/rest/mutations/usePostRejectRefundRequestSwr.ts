import useSWRMutation from "swr/mutation"
import {
    rejectRefundRequest,
    type RefundRequestView,
    type RefundReviewRequest,
} from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link rejectRefundRequest}.
 */
export const usePostRejectRefundRequestSwr = () => {
    const swr = useSWRMutation<
        RefundRequestView,
        Error,
        string,
        { id: string; request: RefundReviewRequest }
    >(
        "POST_REJECT_REFUND_REQUEST_SWR",
        async (_key, { arg }) => {
            return rejectRefundRequest(arg.id, arg.request)
        },
    )

    return swr
}
