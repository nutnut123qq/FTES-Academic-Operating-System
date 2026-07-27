"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { computeCartSavings } from "@/components/features/cart/cartSavings"
import type { CartItemView } from "@/modules/api/rest/commerce"

/** Props for {@link CartSavingsSummary}. */
export interface CartSavingsSummaryProps {
    /** The cart line items (each carries `unitPrice` + optional `originalPriceVnd`). */
    items: CartItemView[]
    /** The BE-charged cart subtotal — used as the current total shown to the buyer. */
    subtotal: number
}

/**
 * The cart's savings summary — shared by the mini-cart drawer
 * ({@link import("@/components/drawers/MiniCartDrawer").MiniCartDrawer}) and the `/cart`
 * page ({@link import("../CartShell").CartShell}) so the two never drift. Renders a
 * "Total" row whose amount is the shared {@link PriceTag} (the charged total, with the
 * summed list price struck through and a `−X%` chip whenever the cart carries any
 * discount) plus a green "You save {amount}" line. Every figure is derived on the
 * client from the per-line list vs charged prices via {@link computeCartSavings} — no
 * backend savings endpoint is involved.
 *
 * @param props - {@link CartSavingsSummaryProps}
 */
export const CartSavingsSummary = ({ items, subtotal }: CartSavingsSummaryProps) => {
    const t = useTranslations("cart")
    const format = useFormatter()
    const { currentTotal, originalTotal, savedAmount, hasSavings } = computeCartSavings(items, subtotal)

    /** One money template for the whole summary (mirrors the app's `priceVnd` format). */
    const money = (amount: number) => t("priceVnd", { amount: format.number(amount) })

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
                <Typography type="body" weight="semibold">
                    {t("total")}
                </Typography>
                <PriceTag
                    discounted={currentTotal}
                    original={hasSavings ? originalTotal : null}
                    size="md"
                    className="justify-end"
                />
            </div>
            {hasSavings ? (
                <Typography type="body-sm" className="text-success">
                    {t("savings", { amount: money(savedAmount) })}
                </Typography>
            ) : null}
        </div>
    )
}

export default CartSavingsSummary
