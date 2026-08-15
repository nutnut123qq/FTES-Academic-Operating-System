"use client"

import useSWR from "swr"
import {
    getMyOrders,
    type OrderView,
    type PageView,
} from "@/modules/api/rest/commerce"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's order history. */
export const MY_ORDERS_SWR_KEY = "GET_MY_ORDERS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyOrdersSwr}. `null` disables the
 * fetch (guest, or the `me` query still in flight). Import this from a call site that
 * needs to `mutate` the entry — never hand-write the tuple.
 */
export const myOrdersKey = (
    viewerId: string | null,
    params?: { page?: number; size?: number },
) => (viewerId ? ([MY_ORDERS_SWR_KEY, viewerId, params?.page, params?.size] as const) : null)

/**
 * SWR query wrapper for {@link getMyOrders}.
 *
 * The key carries the VIEWER ID: paging params alone do not identify an account, so on
 * the old key the FIRST PAGE OF ORDERS — amounts, items, order ids — is one shared cache
 * entry. Sign out of A and into B in the same tab and B is painted A's purchase history
 * straight from the cache. The hook also stays idle until a viewer resolves, so a
 * half-hydrated session never writes an unattributable answer into the cache.
 */
export const useGetMyOrdersSwr = (params?: { page?: number; size?: number }) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<PageView<OrderView>, Error>(
        authenticated ? myOrdersKey(viewerId, params) : null,
        () => getMyOrders(params),
    )

    return swr
}
