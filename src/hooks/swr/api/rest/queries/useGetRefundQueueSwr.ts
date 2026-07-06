"use client"

import useSWR from "swr"
import {
    getRefundQueue,
    type PageView,
    type RefundRequestView,
} from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link getRefundQueue}.
 */
export const useGetRefundQueueSwr = (params?: {
    page?: number
    size?: number
}) => {
    const swr = useSWR<PageView<RefundRequestView>, Error>(
        ["GET_REFUND_QUEUE_SWR", params?.page, params?.size],
        () => getRefundQueue(params),
    )

    return swr
}
