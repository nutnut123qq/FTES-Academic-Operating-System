"use client"

import React from "react"
import { Button, Drawer } from "@heroui/react"
import { ArrowRightIcon, ShoppingCartIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { CartLineItem } from "@/components/features/cart/CartLineItem"
import { CartLineItemSkeleton } from "@/components/features/cart/CartLineItem/CartLineItemSkeleton"
import { CartSavingsSummary } from "@/components/features/cart/CartSavingsSummary"
import { computeCartSavings } from "@/components/features/cart/cartSavings"
import { useRouter } from "@/i18n/navigation"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { useGetCartSwr } from "@/hooks/swr/api/rest/queries/useGetCartSwr"
import { usePostRemoveCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostRemoveCartItemSwr"
import { useMiniCartOverlayState, usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryProductsSwr } from "@/components/features/marketplace/hooks/useQueryProductsSwr"

/**
 * MiniCartInner — the mini-cart's data-backed body + footer. Rendered ONLY while
 * the drawer is open (react-aria unmounts the drawer subtree when closed), so its
 * SWR reads (`GET /commerce/cart`, the product catalog) never fire on pages where
 * the shopper hasn't touched the cart. Reuses the SAME cart list logic + shared
 * SWR keys as the `/cart` page ({@link import("@/components/features/cart/CartShell").CartShell}) —
 * line list, subtotal, remove, and the shared VietQR checkout via the payment overlay —
 * so the drawer and the full page never drift.
 * @param onClose - closes the drawer (called before navigating away / opening the payment modal, never stack overlays)
 */
const MiniCartInner = ({ onClose }: { onClose: () => void }) => {
    const t = useTranslations("cart")
    const router = useRouter()
    const { mutate } = useSWRConfig()

    const cartSwr = useGetCartSwr()
    const removeSwr = usePostRemoveCartItemSwr()
    const payment = usePaymentOverlayState()
    const { products } = useQueryProductsSwr()

    const items = cartSwr.data?.items ?? []
    const subtotal = cartSwr.data?.subtotal ?? 0
    const nameOf = (productId: string) =>
        products.find((product) => product.id === productId)?.name ?? t("item")

    const remove = async (id: string) => {
        await removeSwr.trigger(id)
        void mutate("GET_CART_SWR")
    }

    /** Open the full `/cart` page — close the drawer first (never stack overlays). */
    const viewFullCart = () => {
        onClose()
        router.push("/cart")
    }

    /** Open the shared VietQR checkout for the whole cart (close the drawer first). */
    const checkout = () => {
        onClose()
        // Carry the summed list total so the modal summary strikes the pre-discount price
        // + shows the saving — same figures the CartSavingsSummary shows in the footer.
        const { originalTotal, hasSavings } = computeCartSavings(items, subtotal)
        payment.open({
            itemIds: items.map((item) => item.id),
            title: t("summary", { count: items.length }),
            amountVnd: subtotal,
            originalAmountVnd: hasSavings ? originalTotal : undefined,
        })
    }

    return (
        <>
            <Drawer.Body className="min-h-0 flex-1">
                <AsyncContent
                    isLoading={cartSwr.isLoading}
                    skeleton={
                        <div className="flex flex-col gap-3">
                            {Array.from({ length: 3 }, (_, index) => (
                                <CartLineItemSkeleton key={index} />
                            ))}
                        </div>
                    }
                    error={cartSwr.error}
                    errorContent={{
                        title: t("errorTitle"),
                        description: t("errorDescription"),
                        onRetry: () => void cartSwr.mutate(),
                        retryLabel: t("retry"),
                    }}
                    isEmpty={items.length === 0}
                    emptyContent={{
                        title: t("empty"),
                        icon: <ShoppingCartIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                    }}
                >
                    <div className="flex flex-col gap-3">
                        {items.map((item) => (
                            <CartLineItem
                                key={item.id}
                                item={item}
                                name={nameOf(item.productId)}
                                onRemove={() => void remove(item.id)}
                                isRemoving={removeSwr.isMutating}
                            />
                        ))}
                    </div>
                </AsyncContent>
            </Drawer.Body>

            {items.length > 0 ? (
                <Drawer.Footer className="flex flex-col gap-3 border-t border-separator">
                    <CartSavingsSummary items={items} subtotal={subtotal} />
                    <Button variant="primary" onPress={checkout} fullWidth>
                        {t("checkout")}
                        <ArrowRightIcon className="size-5" aria-hidden focusable="false" />
                    </Button>
                    <Button variant="tertiary" onPress={viewFullCart} fullWidth>
                        {t("viewFullCart")}
                    </Button>
                </Drawer.Footer>
            ) : null}
        </>
    )
}

/**
 * MiniCartDrawer — the slide-out cart preview opened from the navbar
 * {@link import("@/components/features/navbar/Navbar/CartButton").CartButton}.
 * Right sheet on desktop, bottom sheet on mobile. Mounted once globally by
 * {@link import("../DrawerContainer").DrawerContainer}; the body only renders while
 * open (so the cart + catalog reads don't fire until the shopper opens it), and it
 * reuses the SAME cart line list + shared VietQR checkout as the `/cart` page rather
 * than rebuilding a second cart UI. Open state lives in the shared overlay store
 * (`miniCart` key).
 */
export const MiniCartDrawer = () => {
    const t = useTranslations("cart")
    const { isOpen, setOpen, close } = useMiniCartOverlayState()
    const { isMobile } = useSmViewpoint()

    return (
        <Drawer>
            <Drawer.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
                <Drawer.Content placement={isMobile ? "bottom" : "right"}>
                    <Drawer.Dialog className="flex h-full flex-col">
                        <Drawer.CloseTrigger />
                        <Drawer.Header className="flex items-center gap-2">
                            <ShoppingCartIcon className="size-5 text-accent" aria-hidden focusable="false" />
                            <Drawer.Heading>{t("title")}</Drawer.Heading>
                        </Drawer.Header>
                        <MiniCartInner onClose={close} />
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer.Backdrop>
        </Drawer>
    )
}

export default MiniCartDrawer
