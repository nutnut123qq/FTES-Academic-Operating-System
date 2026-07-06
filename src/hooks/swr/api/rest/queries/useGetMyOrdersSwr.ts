"use client"

import useSWR from "swr"
import {
    getMyOrders,
    type OrderView,
    type PageView,
} from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link getMyOrders}.
 */
export const useGetMyOrdersSwr = (params?: { page?: number; size?: number }) => {
    const swr = useSWR<PageView<OrderView>, Error>(
        ["GET_MY_ORDERS_SWR", params?.page, params?.size],
        () => getMyOrders(params),
    )

    return swr
}
