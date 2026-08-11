"use client"

import useSWR from "swr"
import { listProducts } from "@/modules/api/rest/commerce"
import { toProduct } from "./useQueryProductsSwr"

/**
 * BE `ProductType` values the STORE is allowed to sell. The shop sells
 * vouchers/merch/credits/premium — NOT courses: a course is bought from its own
 * detail page (the `COURSE_UNLOCK` product), so that type is deliberately absent
 * here.
 *
 * Verified against `commerce/domain/ProductType.java`, whose members are exactly
 * MERCHANDISE · PREMIUM_SUBSCRIPTION · AI_CREDITS · VOUCHER · COURSE_UNLOCK. (The
 * "e.g." list in `modules/api/rest/commerce/types.ts` says `SUBSCRIPTION` and is
 * simply wrong — do not "fix" this list to match it.)
 *
 * This is a WHITELIST: a product type added to the BE enum later will not reach the
 * shelves until its name is added here. That is deliberate — a new type showing up
 * unannounced is worse for a shop than one arriving a deploy late — but it is the
 * thing to check first if a new category never appears.
 */
const STORE_PRODUCT_TYPES = ["MERCHANDISE", "PREMIUM_SUBSCRIPTION", "AI_CREDITS", "VOUCHER"] as const

/**
 * Loads the STORE catalog: one `GET /commerce/products?type=…` call PER sellable
 * type, merged into a single list.
 *
 * Why one call per type instead of fetching everything once and dropping the
 * course products client-side: the endpoint caps a page at 100 rows
 * (`MAX_PAGE_SIZE`) ordered by `createdAt` DESC, and the mass-backfilled
 * `COURSE_UNLOCK` products sit at the head of that list — a client-side
 * `filter(…)` would routinely throw away the whole window and leave the store
 * EMPTY. Querying by type gives every sellable type its own 100-row window.
 *
 * A type whose request fails is skipped rather than killing the whole store; only
 * when nothing at all could be loaded does the error surface (so the catalog shows
 * its error + retry state instead of pretending the shelves are empty).
 */
export const useQueryStoreProductsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["commerce", "products", "store"],
        async () => {
            const pages = await Promise.allSettled(
                STORE_PRODUCT_TYPES.map((type) => listProducts({ type, size: 100 })),
            )
            const items = pages.flatMap((page) => (page.status === "fulfilled" ? page.value.items : []))
            const rejected = pages.find((page): page is PromiseRejectedResult => page.status === "rejected")
            // A partial failure keeps the shop open, so it would otherwise vanish without a
            // trace: one type silently missing looks identical to that type being sold out.
            pages.forEach((page, index) => {
                if (page.status === "rejected") {
                    console.warn(`[store] product type ${STORE_PRODUCT_TYPES[index]} failed to load`, page.reason)
                }
            })
            if (items.length === 0 && rejected) throw rejected.reason
            return items.map(toProduct)
        },
    )
    return { products: data ?? [], isLoading, error, mutate }
}
