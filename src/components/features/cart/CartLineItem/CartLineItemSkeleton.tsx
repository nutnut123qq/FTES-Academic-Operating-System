import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * Loading placeholder for one {@link CartLineItem} row — mirrors the real row per
 * the house skeleton rule: the same `p-3` bordered row, a leading `size-14
 * rounded-xl` thumbnail box, the name + price text bars, and a trailing trash
 * button box. Shared by the `/cart` page and the mini-cart drawer so both loading
 * states track CartLineItem together.
 */
export const CartLineItemSkeleton = () => (
    <div className="flex items-center gap-3 rounded-2xl border border-separator p-3">
        <Skeleton className="size-14 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton.Typography type="body-sm" width="1/2" />
            <Skeleton.Typography type="body-sm" width="1/4" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-lg" />
    </div>
)

export default CartLineItemSkeleton
