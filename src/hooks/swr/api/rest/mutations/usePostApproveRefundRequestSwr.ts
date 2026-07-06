import useSWRMutation from "swr/mutation"
import { approveRefundRequest, type RefundRequestView } from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link approveRefundRequest}.
 */
export const usePostApproveRefundRequestSwr = () => {
    const swr = useSWRMutation<RefundRequestView, Error, string, string>(
        "POST_APPROVE_REFUND_REQUEST_SWR",
        async (_key, { arg }) => {
            return approveRefundRequest(arg)
        },
    )

    return swr
}
