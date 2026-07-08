"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { ShoppingCartIcon, TrashIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
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
    const format = useFormatter()
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
        payment.open({
            itemIds: items.map((item) => item.id),
            title: t("summary", { count: items.length }),
            amountVnd: subtotal,
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
                            <div
                                key={index}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-separator p-4"
                            >
                                <Skeleton.Typography type="body-sm" width="1/2" />
                                <Skeleton.Typography type="body-sm" width="1/4" />
                            </div>
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
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-separator p-4"
                        >
                            <div className="min-w-0">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {nameOf(item.productId)}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("quantity", { count: item.quantity })}
                                </Typography>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <Typography type="body-sm" weight="bold" className="text-accent">
                                    {t("priceVnd", { amount: format.number((item.unitPrice ?? 0) * item.quantity) })}
                                </Typography>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    isIconOnly
                                    aria-label={t("remove")}
                                    onPress={() => void remove(item.id)}
                                    isDisabled={removeSwr.isMutating}
                                >
                                    <TrashIcon className="size-4" aria-hidden />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between gap-3 border-t border-separator pt-4">
                        <Typography type="body-sm" color="muted">
                            {t("subtotal")}
                        </Typography>
                        <Typography type="body" weight="bold" className="text-accent">
                            {t("priceVnd", { amount: format.number(subtotal) })}
                        </Typography>
                    </div>

                    <Button variant="primary" onPress={checkout} fullWidth>
                        {t("checkout")}
                    </Button>
                </div>
            </AsyncContent>
        </div>
    )
}
