"use client"

import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import {
    createTopupOrder,
    getTopupPacks,
    type TopupOrderRequest,
    type TopupOrderView,
    type TopupPackView,
} from "@/modules/api/rest/wallet"
import { getOrder } from "@/modules/api/rest/commerce"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/**
 * Order statuses that mean "the money question is settled — stop polling".
 *
 * PAID/SUCCESS credit the coins; the rest end the wait without them. Anything not
 * listed here (PENDING, AWAITING_PAYMENT, …) keeps the poll running, which is the
 * safe default: a status this list has not heard of must not be read as success.
 */
const TERMINAL_ORDER_STATUSES = new Set([
    "PAID", "SUCCESS", "COMPLETED", "FULFILLED",
    "CANCELLED", "CANCELED", "EXPIRED", "FAILED", "REFUNDED",
])

/** Statuses that mean the coins were actually credited. */
const PAID_ORDER_STATUSES = new Set(["PAID", "SUCCESS", "COMPLETED", "FULFILLED"])

/** How often the pending top-up order is re-read while the payer is looking at the QR. */
const ORDER_POLL_MS = 4000

/** True when `status` says the top-up succeeded and the coins are in the wallet. */
export const isTopupPaid = (status: string | undefined): boolean =>
    status !== undefined && PAID_ORDER_STATUSES.has(status.toUpperCase())

/** True when the order will not change any more, whichever way it went. */
export const isTopupSettled = (status: string | undefined): boolean =>
    status !== undefined && TERMINAL_ORDER_STATUSES.has(status.toUpperCase())

/**
 * Lists the top-up packs on offer (`GET /api/v1/wallet/topup/packs`).
 *
 * Auth-gated on an identified viewer like every other wallet read. An EMPTY array is a
 * valid answer (nothing on sale, or packs hidden because their price drifted from the
 * conversion rate) and the caller must render an empty state, not an error.
 */
export const useTopupPacksSwr = (enabled: boolean = true) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    return useSWR<Array<TopupPackView>, Error>(
        enabled && authenticated && viewerId ? ["wallet", "topup", "packs", viewerId] : null,
        () => getTopupPacks(),
    )
}

/**
 * Opens a top-up order for one pack (`POST /api/v1/wallet/topup/orders`).
 *
 * MONEY PATH — two guards, and they are not the same guard:
 *  - the BE returns the SAME pending order when the same pack is asked for twice, so a
 *    double click cannot open two orders server-side;
 *  - `isMutating` (used by the caller to disable the button) is what stops the SECOND
 *    request from racing the first and replacing the QR the payer may already be
 *    scanning. Neither one alone is enough.
 */
export const usePostTopupOrderSwr = () => {
    return useSWRMutation<TopupOrderView, Error, string, TopupOrderRequest>(
        "POST_WALLET_TOPUP_ORDER_SWR",
        async (_key, { arg }) => createTopupOrder(arg),
    )
}

/**
 * Polls one commerce order while a top-up is awaiting the bank.
 *
 * The coins are credited by the bank webhook, NOT by the request that created the order,
 * so the only honest way to tell the payer "done" is to keep asking the order until it
 * settles. Polling stops on its own once the status is terminal, so a page left open on a
 * paid order does not keep hitting the BE forever.
 */
export const useTopupOrderStatusSwr = (orderId: string | null) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR(
        authenticated && orderId ? ["wallet", "topup", "order", orderId] : null,
        ([, , , id]) => getOrder(id),
        {
            refreshInterval: (latest) => (isTopupSettled(latest?.status) ? 0 : ORDER_POLL_MS),
            revalidateOnFocus: true,
        },
    )
    return {
        order: swr.data,
        status: swr.data?.status,
        isPaid: isTopupPaid(swr.data?.status),
        isSettled: isTopupSettled(swr.data?.status),
        error: swr.error as Error | undefined,
    }
}
