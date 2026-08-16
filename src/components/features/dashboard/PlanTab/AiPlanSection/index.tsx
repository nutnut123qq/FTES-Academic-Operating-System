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
import { PLAN_PAY_METHOD } from "@/modules/api/graphql/mutations/types/purchase-checkout"
import { usePlanPurchase } from "../usePlanPurchase"
import { PlanPurchaseModal } from "../PlanPurchaseModal"

/**
 * AiPlanSection — the "FrosTES Plans" half of the dashboard "My Plan" tab: the
 * purchasable AI subscription tiers beside the free default, with the viewer's
 * current tier marked.
 *
 * Two reads: `aiSubscriptionTiers` for the catalogue and `myAiSettings` for the
 * tier the account is actually on (there is no dedicated "my subscription" query,
 * and `myAiSettings.tier` is the same fact). Only the catalogue gates the
 * loading / error states — a missing settings read costs the "current plan" badge,
 * not the page. No tier published means no tier is on sale, and the empty state
 * says exactly that.
 *
 * Buying is a TWO-step flow: pressing Buy opens {@link PlanPurchaseModal}, which
 * states the plan and the amount; only the confirm inside it creates an order. What
 * comes back is a bank-transfer QR, not a gateway link — this backend has no redirect
 * checkout — so the dialog then shows the QR and polls the order until the bank settles
 * it ({@link usePlanPurchase}). A checkout that fails to start keeps the dialog open
 * with an explicit "nothing was charged" line rather than navigating away.
 */
export const AiPlanSection = () => {
    const t = useTranslations()
    const tiersSwr = useQueryAiSubscriptionTiersSwr()
    const settingsSwr = useQueryMyAiSettingsSwr()
    const { trigger } = useMutatePurchaseAiSubscriptionSwr()

    const [pendingTier, setPendingTier] = useState<AiSubscriptionTier | null>(null)

    const tiers = tiersSwr.data ?? []
    const currentTier = settingsSwr.data?.tier ?? null

    const purchase = usePlanPurchase({
        start: async () => {
            if (!pendingTier) return null
            const result = await trigger({
                tier: pendingTier.tier,
                paymentType: PLAN_PAY_METHOD,
            })
            return result?.data?.purchaseAiSubscription
        },
        // paid → the account is on a new tier; re-read instead of guessing it locally
        onPaid: () => { void settingsSwr.mutate() },
        failureMessage: t("profileSettings.purchase.failed"),
    })

    const closeModal = () => {
        // An order still awaiting payment is deliberately kept alive: closing the dialog
        // must not abandon a live QR, and the poll keeps running so the badge updates
        // once the money lands.
        if (purchase.phase !== "awaiting") purchase.reset()
        setPendingTier(null)
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
                                    isDisabled={isCurrent || purchase.isStarting}
                                    onPress={() => {
                                        purchase.reset()
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

            <PlanPurchaseModal
                isOpen={pendingTier !== null}
                onClose={closeModal}
                planLabel={pendingTier?.displayName ?? ""}
                amountLabel={pendingTier ? formatVnd(pendingTier.priceVnd) : ""}
                // no USD line: there is no international gateway on this backend, so the
                // dollar figure was never an amount anyone could be charged
                amountHint={null}
                isStarting={purchase.isStarting}
                errorMessage={purchase.errorMessage}
                ticket={purchase.ticket}
                phase={purchase.phase}
                onConfirm={() => { void purchase.confirm() }}
                onRetry={purchase.reset}
            />
        </section>
    )
}
