"use client"

import React, { useState } from "react"
import { Button, Chip, Skeleton, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { formatVnd } from "@/components/blocks/commerce/PriceTag"
import { useQueryAiSubscriptionTiersSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiSubscriptionTiersSwr"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import { useMutatePurchaseAiSubscriptionSwr } from "@/hooks/swr/api/graphql/mutations/useMutatePurchaseAiSubscriptionSwr"
import type { AiSubscriptionTier } from "@/modules/api/graphql/queries/types/ai-subscription-tiers"
import { submitCheckout } from "@/modules/payment/submit-checkout"
import { PaymentType } from "@/modules/types/enums/payment-type"
import { PurchaseConfirmModal } from "../PurchaseConfirmModal"

/**
 * Gateways `purchaseAiSubscription` accepts (its request type documents PayOS and
 * SePay only — the international gateways are membership-side).
 */
const AI_PLAN_METHODS = [PaymentType.PayOS, PaymentType.Sepay] as const

/**
 * AiPlanSection — the "Gói FrosTES" settings screen: the purchasable AI
 * subscription tiers beside the free default, with the viewer's current tier
 * marked.
 *
 * Two reads: `aiSubscriptionTiers` for the catalogue and `myAiSettings` for the
 * tier the account is actually on (there is no dedicated "my subscription" query,
 * and `myAiSettings.tier` is the same fact). Only the catalogue gates the
 * loading / error states — a missing settings read costs the "current plan" badge,
 * not the page.
 *
 * Buying is a TWO-step flow: pressing Buy opens {@link PurchaseConfirmModal},
 * which states the plan, the amount and the gateway; only the confirm inside it
 * runs `purchaseAiSubscription`, and the answer is a checkout URL the user still
 * has to complete on the gateway. A failure keeps the dialog open with an explicit
 * "nothing was charged" line rather than navigating away.
 */
export const AiPlanSection = () => {
    const t = useTranslations()
    const tiersSwr = useQueryAiSubscriptionTiersSwr()
    const settingsSwr = useQueryMyAiSettingsSwr()
    const { trigger, isMutating } = useMutatePurchaseAiSubscriptionSwr()

    const [pendingTier, setPendingTier] = useState<AiSubscriptionTier | null>(null)
    const [checkoutError, setCheckoutError] = useState<string | null>(null)

    const tiers = tiersSwr.data ?? []
    const currentTier = settingsSwr.data?.tier ?? null

    /** Run the checkout for the confirmed tier and hand the user to the gateway. */
    const onConfirm = async (method: PaymentType) => {
        if (!pendingTier) return
        setCheckoutError(null)
        try {
            const result = await trigger({
                tier: pendingTier.tier,
                paymentType: method,
                // the gateway sends the user back to this very screen either way
                payosReturnUrl: window.location.href,
                payosCancelUrl: window.location.href,
            })
            const envelope = result?.data?.purchaseAiSubscription
            if (!envelope?.success || !envelope.data?.checkoutUrl) {
                setCheckoutError(envelope?.message || t("profileSettings.purchase.failed"))
                return
            }
            submitCheckout({
                checkoutUrl: envelope.data.checkoutUrl,
                checkoutFields: envelope.data.checkoutFields,
            })
        } catch {
            setCheckoutError(t("profileSettings.purchase.failed"))
        }
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-0">
                <Typography type="h6" weight="bold">
                    {t("aiSubscription.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("aiSubscription.subtitle")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={tiersSwr.isLoading && !tiersSwr.data}
                skeleton={(
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[0, 1, 2, 3].map((row) => (
                            <Skeleton key={row} className="h-56 w-full rounded-2xl" />
                        ))}
                    </div>
                )}
                error={!tiersSwr.data ? tiersSwr.error : undefined}
                errorContent={{
                    title: t("aiSubscription.error"),
                    onRetry: () => { void tiersSwr.mutate() },
                    retryLabel: t("aiSubscription.retry"),
                }}
                isEmpty={tiers.length === 0}
                emptyContent={{
                    title: t("aiSubscription.empty"),
                    onRetry: () => { void tiersSwr.mutate() },
                    retryLabel: t("aiSubscription.retry"),
                }}
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    {/* the free lane is not a purchasable tier — it is what the account
                        falls back to, so it renders as a plain card with no CTA */}
                    <div
                        className={cn(
                            "flex flex-col gap-3 rounded-2xl border p-4",
                            currentTier === null ? "border-accent bg-accent/5" : "border-default",
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <Typography type="body" weight="bold">
                                {t("aiSubscription.free.title")}
                            </Typography>
                            {currentTier === null ? (
                                <Chip size="sm" variant="soft" color="accent">
                                    {t("aiSubscription.currentPlan")}
                                </Chip>
                            ) : null}
                        </div>
                        <Typography type="h5" weight="bold">
                            {t("aiSubscription.free.price")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("aiSubscription.free.desc")}
                        </Typography>
                        <Button size="sm" variant="secondary" isDisabled className="mt-auto">
                            {t("aiSubscription.free.cta")}
                        </Button>
                    </div>

                    {tiers.map((tier) => {
                        const isCurrent = currentTier === tier.tier
                        return (
                            <div
                                key={tier.tier}
                                className={cn(
                                    "flex flex-col gap-3 rounded-2xl border p-4",
                                    isCurrent ? "border-accent bg-accent/5" : "border-default",
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <Typography type="body" weight="bold">
                                        {tier.displayName}
                                    </Typography>
                                    {isCurrent ? (
                                        <Chip size="sm" variant="soft" color="accent">
                                            {t("aiSubscription.currentPlan")}
                                        </Chip>
                                    ) : tier.popular ? (
                                        <Chip size="sm" variant="soft" color="warning">
                                            {t("aiSubscription.popular")}
                                        </Chip>
                                    ) : null}
                                </div>

                                <div className="flex items-baseline gap-1">
                                    <Typography type="h5" weight="bold">
                                        {formatVnd(tier.priceVnd)}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("aiSubscription.perMonth")}
                                    </Typography>
                                </div>
                                <Typography type="body-xs" color="muted">
                                    {t("aiSubscription.priceUsdHint", {
                                        amount: `$${tier.priceUsd}`,
                                    })}
                                </Typography>

                                <Typography type="body-xs" color="muted">
                                    {tier.description}
                                </Typography>

                                <ul className="flex flex-col gap-1">
                                    {[
                                        t("aiSubscription.creditsPer5h", { credits: tier.creditsPer5h }),
                                        t("aiSubscription.creditsPerWeek", { credits: tier.creditsPerWeek }),
                                    ].map((line) => (
                                        <li key={line} className="flex items-center gap-2 text-xs text-muted">
                                            <CheckCircleIcon
                                                className="size-4 shrink-0 text-success"
                                                aria-hidden
                                                focusable="false"
                                            />
                                            {line}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    size="sm"
                                    variant={isCurrent ? "secondary" : "primary"}
                                    className="mt-auto"
                                    isDisabled={isCurrent || isMutating}
                                    onPress={() => {
                                        setCheckoutError(null)
                                        setPendingTier(tier)
                                    }}
                                >
                                    {isCurrent ? t("aiSubscription.currentPlan") : t("aiSubscription.buy")}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </AsyncContent>

            <PurchaseConfirmModal
                isOpen={pendingTier !== null}
                onClose={() => {
                    setPendingTier(null)
                    setCheckoutError(null)
                }}
                planLabel={pendingTier?.displayName ?? ""}
                amountLabel={pendingTier ? formatVnd(pendingTier.priceVnd) : ""}
                amountHint={pendingTier
                    ? t("aiSubscription.priceUsdHint", { amount: `$${pendingTier.priceUsd}` })
                    : null}
                methods={[...AI_PLAN_METHODS]}
                isPending={isMutating}
                errorMessage={checkoutError}
                onConfirm={(method) => { void onConfirm(method) }}
            />
        </section>
    )
}
