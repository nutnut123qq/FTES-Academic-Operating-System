"use client"

import useSWR from "swr"
import { getOrder, isTerminalOrderStatus, type OrderView } from "@/modules/api/rest/commerce"

/** Options for {@link useGetOrderSwr}. */
export interface UseGetOrderSwrOptions {
    /**
     * When true, re-fetch every 3s until the order reaches a terminal status
     * (paid/failed/cancelled/expired) — used to wait for the VietQR webhook to
     * flip `AWAITING_PAYMENT → PAID`. Paused when the tab is hidden.
     */
    poll?: boolean
}

/**
 * SWR query wrapper for {@link getOrder}. Passing `{ poll: true }` turns it into
 * a self-stopping poll for the payment-await flow. The key is gated on `orderId`
 * so an empty id (no order yet / modal closed) issues no request.
 */
export const useGetOrderSwr = (orderId: string, opts?: UseGetOrderSwrOptions) => {
    const swr = useSWR<OrderView, Error>(
        orderId ? ["GET_ORDER_SWR", orderId] : null,
        () => getOrder(orderId),
        opts?.poll
            ? {
                  refreshInterval: (data) =>
                      isTerminalOrderStatus(data?.status) ? 0 : 3000,
                  refreshWhenHidden: false,
              }
            : undefined,
    )

    return swr
}
