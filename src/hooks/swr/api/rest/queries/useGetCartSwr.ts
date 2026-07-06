"use client"

import useSWR from "swr"
import { getCart, type CartView } from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link getCart}.
 */
export const useGetCartSwr = () => {
    const swr = useSWR<CartView, Error>("GET_CART_SWR", getCart)

    return swr
}
