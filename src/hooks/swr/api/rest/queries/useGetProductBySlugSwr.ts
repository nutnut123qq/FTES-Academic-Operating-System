"use client"

import useSWR from "swr"
import {
    getProductBySlug,
    type ProductView,
} from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link getProductBySlug}.
 */
export const useGetProductBySlugSwr = (slug: string) => {
    const swr = useSWR<ProductView, Error>(
        ["GET_PRODUCT_BY_SLUG_SWR", slug],
        () => getProductBySlug(slug),
    )

    return swr
}
