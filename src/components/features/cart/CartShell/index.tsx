"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { ShoppingCartIcon } from "@phosphor-icons/react"
import { useRouter } from "@/i18n/navigation"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { CartLineItem } from "@/components/features/cart/CartLineItem"
import { CartLineItemSkeleton } from "@/components/features/cart/CartLineItem/CartLineItemSkeleton"
import { CartSavingsSummary } from "@/components/features/cart/CartSavingsSummary"
import { computeCartSavings } from "@/components/features/cart/cartSavings"
import { useGetCartSwr } from "@/hooks/swr/api/rest/queries/useGetCartSwr"
import { usePostRemoveCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostRemoveCartItemSwr"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryProductsSwr } from "@/components/features/marketplace/hooks/useQueryProductsSwr"

/**
 * CartShell (§13) — the `/cart` page. Lists the current cart from
 * `GET /commerce/cart`, lets the user remove line items, and opens the shared
 * PaymentModal (VietQR) for the whole cart. Item names are joined from the
 * marketplace product catalog since the cart view only carries product ids.
 * ponytail: single VietQR checkout for the cart (coin pay stays per-item in
 * buy-now, where the coin price is known).
 */
export const CartShell = () => {
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

    const checkout = () => {
        // Carry the summed list total so the modal summary can strike the pre-discount
        // price + show the saving — same figures the CartSavingsSummary shows here.
        const { originalTotal, hasSavings } = computeCartSavings(items, subtotal)
        payment.open({
            itemIds: items.map((item) => item.id),
            title: t("summary", { count: items.length }),
            amountVnd: subtotal,
            originalAmountVnd: hasSavings ? originalTotal : undefined,
            // Từng dòng hàng để bước Tóm tắt của modal liệt kê ĐÚNG những khoá đang mua
            // (tên · ảnh · giá) chứ không chỉ "Giỏ hàng (N sản phẩm)" + một cục tiền.
            lines: items.map((item) => ({
                id: item.id,
                name: nameOf(item.productId),
                priceVnd: item.unitPrice ?? 0,
                originalPriceVnd: item.originalPriceVnd ?? null,
                imageUrl: item.imageUrl ?? null,
            })),
        })
    }

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
            <div className="flex items-center gap-2">
                <ShoppingCartIcon className="size-6 text-accent" aria-hidden />
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
            </div>

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
                    icon: <FtesMascot pose="explain" size="lg" />,
                    title: t("empty"),
                    description: t("emptyHint"),
                    action: (
                        <Button variant="primary" onPress={() => router.push("/courses")}>
                            {t("emptyBrowse")}
                        </Button>
                    ),
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

                    <div className="border-t border-separator pt-4">
                        <CartSavingsSummary items={items} subtotal={subtotal} />
                    </div>

                    <Button variant="primary" onPress={checkout} fullWidth>
                        {t("checkout")}
                    </Button>
                </div>
            </AsyncContent>
        </div>
    )
}
