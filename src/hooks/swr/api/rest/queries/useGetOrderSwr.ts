"use client"

import useSWR from "swr"
import { getOrder, type OrderView } from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link getOrder}.
 */
export const useGetOrderSwr = (orderId: string) => {
    const swr = useSWR<OrderView, Error>(
        ["GET_ORDER_SWR", orderId],
        () => getOrder(orderId),
    )

    return swr
}
