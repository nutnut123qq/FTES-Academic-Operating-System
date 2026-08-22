"use client"

import useSWR from "swr"
import { getPendingOrders } from "@/modules/api/rest/commerce/commerce"
import type { OrderView } from "@/modules/api/rest/commerce/types"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/**
 * SWR query for {@link getPendingOrders} (`GET /api/v1/commerce/orders/pending`) — up to 5 unpaid
 * orders of the current user, powering the account-menu "pay invoice" entry.
 *
 * Auth-gated + viewer-scoped like the wallet hook: guests key to `null` (no `/me` 401 storm), and
 * the viewer id in the key stops a cross-account order list bleeding through the SWR cache on an
 * in-tab account switch.
 */
export const useGetPendingOrdersSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    return useSWR<OrderView[], Error>(
        authenticated && viewerId ? ["GET_PENDING_ORDERS_SWR", viewerId] : null,
        () => getPendingOrders(),
    )
}
