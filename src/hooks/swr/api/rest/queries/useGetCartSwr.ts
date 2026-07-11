"use client"

import useSWR from "swr"
import { getCart, type CartView } from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link getCart}.
 *
 * `GET /commerce/cart` is a signed-in-only endpoint, so pass `enabled: false`
 * (e.g. for guests) to skip the request entirely — the shared `"GET_CART_SWR"`
 * mutate key is unchanged, so authed callers and PaymentModal revalidation are
 * unaffected. Defaults to enabled to keep existing callers identical.
 */
export const useGetCartSwr = (enabled = true) => {
    const swr = useSWR<CartView, Error>(enabled ? "GET_CART_SWR" : null, getCart)

    return swr
}
