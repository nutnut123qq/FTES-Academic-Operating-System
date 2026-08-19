"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Button, Typography } from "@heroui/react"
import { ImageSquareIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { PriceTag, formatVnd } from "@/components/blocks/commerce/PriceTag"
import type { CartItemView } from "@/modules/api/rest/commerce"

/** Props for {@link CartLineItem}. */
export interface CartLineItemProps {
    /** The cart line (carries id, productId, quantity, unitPrice, imageUrl, originalPriceVnd). */
    item: CartItemView
    /** Resolved display name — the parent joins `productId` against the product catalog. */
    name: string
    /** Remove this line from the cart. */
    onRemove: () => void
    /** Whether a remove mutation is in flight (disables the trash button). */
    isRemoving?: boolean
}

/**
 * The square course thumbnail for a cart line. Uses the line's `imageUrl` (the linked
 * course cover) with a graceful icon fallback when it is absent or 404s. optimizer
 * skips the Next optimizer so no `remotePatterns` config is needed for arbitrary covers.
 */
const CartThumbnail = ({ imageUrl, alt }: { imageUrl: string | null; alt: string }) => {
    const [failed, setFailed] = useState(false)
    if (!imageUrl || failed) {
        return (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-default">
                <ImageSquareIcon aria-hidden focusable="false" className="size-6 text-muted" />
            </div>
        )
    }
    return (
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-default">
            <Image
                src={imageUrl}
                alt={alt}
                fill
                sizes="56px"
                className="object-cover"
                onError={() => setFailed(true)}
            />
        </div>
    )
}

/**
 * One cart line, shared by the `/cart` page ({@link import("../CartShell").CartShell})
 * and the mini-cart drawer so the two never drift: a course thumbnail, the resolved
 * product name, and the price via the shared {@link PriceTag} block — the charged unit
 * price with the `originalPriceVnd` struck through and a "-X%" savings chip whenever the
 * list price is higher. A quiet trash button removes the line. A course is added to the
 * cart exactly once (quantity is always 1), so no quantity is shown or multiplied.
 *
 * @param props - {@link CartLineItemProps}
 */
export const CartLineItem = ({ item, name, onRemove, isRemoving }: CartLineItemProps) => {
    const t = useTranslations("cart")
    const unitPrice = item.unitPrice ?? 0
    const original =
        item.originalPriceVnd != null && item.originalPriceVnd > unitPrice
            ? item.originalPriceVnd
            : null
    // per-line saving in VND (list − charged); 0 when the line has no discount. A course
    // is only ever in the cart once (quantity is always 1), so there is no × quantity.
    const saving = original != null ? original - unitPrice : 0

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-separator p-3">
            <CartThumbnail imageUrl={item.imageUrl ?? null} alt={name} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography type="body-sm" weight="medium" truncate>
                    {name}
                </Typography>
                <PriceTag discounted={unitPrice} original={original} size="sm" />
                {saving > 0 ? (
                    <Typography type="body-xs" className="text-success">
                        {t("itemSaving", { amount: formatVnd(saving) })}
                    </Typography>
                ) : null}
            </div>
            <Button
                size="sm"
                variant="ghost"
                isIconOnly
                aria-label={t("remove")}
                onPress={onRemove}
                isDisabled={isRemoving}
            >
                <TrashIcon className="size-4" aria-hidden />
            </Button>
        </div>
    )
}

export default CartLineItem
