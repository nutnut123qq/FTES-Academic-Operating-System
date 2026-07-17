"use client"

import React from "react"
import {
    Badge,
    Button,
    cn,
} from "@heroui/react"
import { ShoppingCartIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { useGetCartSwr } from "@/hooks/swr/api/rest/queries/useGetCartSwr"
import { useMiniCartOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Largest cart count rendered verbatim on the badge before showing "99+". */
const MAX_BADGE = 99

/** Props for {@link CartButton}. */
export type CartButtonProps = WithClassNames<undefined>

/**
 * CartButton — navbar shopping-cart icon that opens the slide-out mini-cart drawer
 * ({@link import("@/components/drawers/MiniCartDrawer").MiniCartDrawer}) and shows a
 * badge with the number of items in the viewer's cart. Tapping it opens the drawer
 * in place (a cart PREVIEW) rather than navigating to `/cart` — the drawer itself
 * offers "view full cart" for the deep review.
 *
 * Reads the SAME real BE `GET /commerce/cart` SWR key ({@link useGetCartSwr}) the
 * cart page and PaymentModal share, so the count stays live as items are added
 * (course enroll) or the cart is checked out. The badge is hidden at zero; the
 * whole control is hidden for guests (the cart endpoint is signed-in only, and an
 * empty cart is meaningless without a session — mirrors {@link NotificationBell}).
 * `"use client"` for the SWR hook + overlay state.
 * @param props - optional root class name (placement only)
 */
export const CartButton = ({ className }: CartButtonProps) => {
    const t = useTranslations()
    const { open: openMiniCart } = useMiniCartOverlayState()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    // gated on auth — GET /commerce/cart 401s for guests, so skip the request
    const { data } = useGetCartSwr(authenticated)

    // the cart is only meaningful for an authenticated viewer
    if (!authenticated) {
        return null
    }

    // count distinct line items — matches the cart page summary ({items.length})
    const count = data?.items.length ?? 0
    const badgeLabel = count > MAX_BADGE ? `${MAX_BADGE}+` : `${count}`

    return (
        <Button
            isIconOnly
            variant="tertiary"
            className={cn("rounded-full", className)}
            aria-label={t("nav.cart")}
            onPress={openMiniCart}
        >
            {count > 0 ? (
                <Badge.Anchor>
                    <ShoppingCartIcon className="size-5" aria-hidden focusable="false" />
                    <Badge size="sm" color="danger">{badgeLabel}</Badge>
                </Badge.Anchor>
            ) : (
                <ShoppingCartIcon className="size-5" aria-hidden focusable="false" />
            )}
        </Button>
    )
}
