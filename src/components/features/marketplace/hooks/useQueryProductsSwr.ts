"use client"

import useSWR from "swr"
import { listProducts, type ProductView } from "@/modules/api/rest/commerce"

/** Product categories in the §13 Marketplace catalog. */
export type ProductCategory = "merch" | "premium" | "aiCredits" | "voucher" | "courseUnlock"

/** A single catalog product mapped from the commerce BE `ProductView`. */
export interface Product {
    /** Product id (UUID from the BE). */
    id: string
    /** Display name. */
    name: string
    /** Catalog category, derived from the BE product `type`. */
    category: ProductCategory
    /** Price in FTES Coin; `null` when the product is priced only in VND. */
    priceCoin: number | null
    /** Price in VND; `null` when the product is priced only in Coin. */
    priceVnd: number | null
    /** Human-readable description; `""` when the BE omits it. */
    description: string
}

/**
 * Maps a BE `ProductType` enum value onto the catalog's `ProductCategory`.
 * The five BE types map 1:1 to the five FE categories; an unexpected value
 * degrades to "merch" (a real category with an icon) so a card never renders
 * without its badge/icon.
 */
const TYPE_TO_CATEGORY: Record<string, ProductCategory> = {
    MERCHANDISE: "merch",
    PREMIUM_SUBSCRIPTION: "premium",
    AI_CREDITS: "aiCredits",
    VOUCHER: "voucher",
    COURSE_UNLOCK: "courseUnlock",
}

const toCategory = (type: string): ProductCategory => TYPE_TO_CATEGORY[type] ?? "merch"

/** Maps a BE `ProductView` onto the catalog's `Product` model. */
const toProduct = (view: ProductView): Product => ({
    id: view.id,
    name: view.name,
    category: toCategory(view.type),
    priceCoin: view.priceCoin ?? null,
    priceVnd: view.priceVnd ?? null,
    description: view.description ?? "",
})

/**
 * Loads the marketplace product catalog from the commerce BE
 * (`GET /api/v1/commerce/products`, public — active products only). The list may
 * be empty when nothing is seeded, in which case the catalog shows its empty
 * state. Fetches a single large page so client-side search/category filtering
 * keeps working exactly as before.
 */
export const useQueryProductsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["commerce", "products"],
        async () => {
            const result = await listProducts({ size: 100 })
            return result.items.map(toProduct)
        },
    )
    return { products: data ?? [], isLoading, error, mutate }
}
