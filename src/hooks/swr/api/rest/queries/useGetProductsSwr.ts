"use client"

import useSWR from "swr"
import {
    listProducts,
    type PageView,
    type ProductView,
} from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link listProducts}.
 */
export const useGetProductsSwr = (params?: {
    type?: string | null
    page?: number
    size?: number
}) => {
    const swr = useSWR<PageView<ProductView>, Error>(
        ["GET_PRODUCTS_SWR", params?.type, params?.page, params?.size],
        () => listProducts(params),
    )

    return swr
}
