"use client"

import React, { useCallback, useRef, useState } from "react"
import { Button, Chip, Skeleton, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { formatVnd } from "@/components/blocks/commerce/PriceTag"
import { useQueryAiSubscriptionTiersSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiSubscriptionTiersSwr"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import type { AiSubscriptionTier } from "@/modules/api/graphql/queries/types/ai-subscription-tiers"
import { usePlanPurchase } from "../usePlanPurchase"
import { usePlanCoin } from "../usePlanCoin"
import { startPlanCheckout, type PlanCheckoutFailure } from "../planCheckout"
import { PlanPurchaseModal } from "../PlanPurchaseModal"

/** Mã lỗi checkout → key trong `profileSettings.purchase.coin.errors.*`. */
const FAILURE_MESSAGE_KEY: Record<PlanCheckoutFailure, string> = {
    notOnSale: "profileSettings.purchase.coin.errors.notOnSale",
    priceChanged: "profileSettings.purchase.coin.errors.priceChanged",
    insufficientCoin: "profileSettings.purchase.coin.errors.insufficientCoin",
    coinNotSupported: "profileSettings.purchase.coin.errors.coinNotSupported",
    generic: "profileSettings.purchase.failed",
}

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
 * says exactly that: gói ở trạng thái nháp KHÔNG hiện ra đây, và đó là đúng.
 *
 * Buying is a TWO-step flow: pressing Buy opens {@link PlanPurchaseModal}, which
 * states the plan, the amount, and how much Xu the buyer wants to spend on it; only the
 * confirm inside it creates an order.
 *
 * **Vì sao mua qua REST chứ không qua mutation `purchaseAiSubscription` như trước:**
 * mutation đó không nhận `coinToApply`, nên đường duy nhất áp được Xu là gọi thẳng
 * `POST /commerce/checkout` qua giỏ ({@link startPlanCheckout} — mọi chốt an toàn của
 * luồng cũ được dựng lại ở đó). Cái nhận về vẫn là QR chuyển khoản, không phải link cổng
 * thanh toán, nên hộp thoại tiếp tục hiện QR và poll đơn tới khi ngân hàng báo có
 * ({@link usePlanPurchase}) — trừ khi Xu đã phủ trọn đơn, lúc đó đơn `PAID` ngay và không
 * có QR nào để quét. A checkout that fails to start keeps the dialog open with an explicit
 * "nothing was charged" line rather than navigating away.
 */
export const AiPlanSection = () => {
    const t = useTranslations()
    const tiersSwr = useQueryAiSubscriptionTiersSwr()
    const settingsSwr = useQueryMyAiSettingsSwr()

    const [pendingTier, setPendingTier] = useState<AiSubscriptionTier | null>(null)

    const tiers = tiersSwr.data ?? []
    const currentTier = settingsSwr.data?.tier ?? null
    const pendingPriceVnd = pendingTier?.priceVnd ?? 0

    const coin = usePlanCoin(pendingPriceVnd, pendingTier !== null)

    /**
     * Khoá idempotency của lần mua đang mở. Giữ NGUYÊN giữa các lần bấm để hai lần bấm (hay
     * một lần bấm mất phản hồi) chỉ ra đúng một đơn; chỉ đổi khi đơn của khoá cũ đã chết —
     * xem `keyBurnt` ở {@link startPlanCheckout}.
     */
    const idempotencyKeyRef = useRef<string>("")
    const newKey = useCallback(() => {
        idempotencyKeyRef.current = `plan:${crypto.randomUUID()}`
    }, [])

    const purchase = usePlanPurchase({
        start: async () => {
            if (!pendingTier) return null
            if (!idempotencyKeyRef.current) newKey()
            const outcome = await startPlanCheckout({
                slug: pendingTier.tier,
                expectedPriceVnd: pendingTier.priceVnd,
                // Số Xu đã kẹp theo TRẦN của báo giá; backend vẫn kiểm lại và từ chối nếu quá.
                coinToApply: coin.coin,
                idempotencyKey: idempotencyKeyRef.current,
            })
            if (outcome.ok) {
                return { ok: true, ticket: outcome.ticket, status: outcome.status }
            }
            if (outcome.keyBurnt) newKey()
            return { ok: false, message: t(FAILURE_MESSAGE_KEY[outcome.failure]) }
        },
        // paid → the account is on a new tier and the coin has left the wallet; re-read both
        // instead of guessing them locally
        onPaid: () => {
            void settingsSwr.mutate()
            void coin.refresh()
        },
        failureMessage: t("profileSettings.purchase.failed"),
        cancelFailureMessage: t("profileSettings.purchase.coin.cancelFailed"),
    })

    /** Huỷ đơn đang chờ → backend hoàn Xu → đọc lại số dư và mở khoá mới cho lần sau. */
    const cancelOrder = useCallback(async () => {
        const cancelled = await purchase.cancel()
        if (cancelled) {
            newKey()
            void coin.refresh()
        }
    }, [coin, newKey, purchase])

    const openTier = (tier: AiSubscriptionTier) => {
        // Đơn cũ đã chốt (trả xong / chết) thì bỏ đi; đơn CÒN ĐANG CHỜ thì giữ nguyên và mở
        // lại đúng nó — quên nó đi là để số Xu đã trừ nằm ngoài ví cho tới lúc đơn hết hạn.
        if (purchase.phase !== "awaiting") {
            purchase.reset()
            newKey()
        }
        setPendingTier(tier)
    }

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
                    description: t("aiSubscription.emptyHint"),
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
                                    onPress={() => openTier(tier)}
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
                onRetry={() => {
                    purchase.reset()
                    newKey()
                }}
                coin={{
                    isLoading: coin.isLoading,
                    hasError: coin.hasError,
                    balance: coin.quote?.balance ?? 0,
                    vndPerCoin: coin.quote?.vndPerCoin ?? 0,
                    maxCoin: coin.maxCoin,
                    coin: coin.coin,
                    discountVnd: coin.breakdown.coinDiscountVnd,
                    payableVnd: coin.breakdown.payableVnd,
                    coversAll: coin.coversAll,
                    onChange: coin.setCoin,
                    onCancelOrder: () => { void cancelOrder() },
                    isCancelling: purchase.isCancelling,
                }}
            />
        </section>
    )
}
