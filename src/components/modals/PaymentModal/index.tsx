"use client"

import React, { useMemo, useState } from "react"
import { Modal, Spinner, Typography, cn } from "@heroui/react"
import useSWR from "swr"
import { ArrowRightIcon, FlameIcon, GraduationCapIcon, LockSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useMutateCourseEnrollSwr } from "@/hooks/swr/api/graphql/mutations/useMutateCourseEnrollSwr"
import { useMutatePurchaseAiSubscriptionSwr } from "@/hooks/swr/api/graphql/mutations/useMutatePurchaseAiSubscriptionSwr"
import { useMutatePurchaseMembershipSwr } from "@/hooks/swr/api/graphql/mutations/useMutatePurchaseMembershipSwr"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryCoursePricePreviewSwr } from "@/hooks/swr/api/graphql/queries/useQueryCoursePricePreviewSwr"
import { useAppSelector } from "@/redux/hooks"
import { PaymentFlow } from "@/modules/types/payment"
import { PaymentType } from "@/modules/types/enums/payment-type"
import { assetConfig } from "@/resources/assets"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { submitCheckout } from "@/modules/payment/submit-checkout"
import { queryAiSubscriptionTiers } from "@/modules/api/graphql/queries/query-ai-subscription-tiers"
import type { DiscountReason } from "@/modules/api/graphql/queries/types/recommended-courses"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import type { PriceCurrency } from "@/components/blocks/commerce/PriceTag"

/** Format an integer VND amount as "1.275.000₫". */
const formatVnd = (amount: number): string => `${amount.toLocaleString("vi-VN")}₫`

/** Format a USD amount as "$3.99". */
const formatUsd = (amount: number): string =>
    amount.toLocaleString("en-US", { style: "currency", currency: "USD" })

/** The unified order shown in the summary, derived per flow. */
interface PaymentOrder {
    /** Product name (course title / AI tier / membership). */
    name: string
    /** Discounted VND price (what domestic gateways charge); undefined while loading. */
    priceVnd?: number
    /** Original (list) VND price (struck through when a discount applies). */
    originalVnd?: number
    /** Active-phase VND price before loyalty (breakdown middle step). */
    phaseVnd?: number
    /** Discounted USD price for international gateways; null when not available. */
    priceUsd?: number | null
    /** Original (list) USD price. */
    originalUsd?: number | null
    /** Active-phase USD price before loyalty. */
    phaseUsd?: number | null
    /** Loyalty discount percent (0 when none — course flow only). */
    discountPercent: number
    /** Why the discount applies (course flow only). */
    discountReason: DiscountReason
    /** Courses the viewer already owns (feeds the discount copy). */
    enrolledCount: number
}

/**
 * Shared payment modal for every paid flow (course enroll · membership · AI subscription).
 *
 * Summary-first: shows WHAT the buyer gets + HOW MUCH (loyalty discount surfaced via the
 * shared {@link PriceTag} + hover breakdown) BEFORE the gateway choice. A currency toggle
 * (Domestic VND ↔ International USD) drives BOTH the shown price and the gateway list; the
 * USD side appears only when the order has a USD price. The opener stashes a
 * {@link import("@/modules/types").PaymentContext}; this modal reads it to decide which
 * price to preview and which mutation to run on pick.
 */
export const PaymentModal = ({ className }: WithClassNames<undefined>) => {
    const { isOpen, setOpen, context } = usePaymentOverlayState()
    const courseEnrollSwr = useMutateCourseEnrollSwr()
    const purchaseAiSubscriptionSwr = useMutatePurchaseAiSubscriptionSwr()
    const purchaseMembershipSwr = useMutatePurchaseMembershipSwr()
    const course = useAppSelector((state) => state.course.entity)
    const coverImageUrl = useAppSelector((state) => state.course.entity?.coverImageUrl)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentType | null>(null)
    // chosen currency / region (drives summary price + gateway list)
    const [currency, setCurrency] = useState<PriceCurrency>("VND")
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()

    const isCourse = context?.flow === PaymentFlow.CourseEnroll
    const isAi = context?.flow === PaymentFlow.AiSubscription
    const isMembership = context?.flow === PaymentFlow.Membership

    // course price preview (original vs loyalty-discounted) — exact checkout pricing
    const coursePriceSwr = useQueryCoursePricePreviewSwr(isCourse ? course?.id ?? null : null)
    // AI tiers fetched modal-locally (the page hook is gated to /profile/ai-subscription)
    const aiTiersSwr = useSWR(
        isAi ? ["PAYMENT_MODAL_AI_TIERS"] : null,
        async () => (await queryAiSubscriptionTiers({})).data?.aiSubscriptionTiers?.data?.tiers ?? [],
    )
    const aiTier = useMemo(
        () => (isAi && context.flow === PaymentFlow.AiSubscription
            ? aiTiersSwr.data?.find((tier) => tier.tier === context.tier)
            : undefined),
        [isAi, context, aiTiersSwr.data],
    )

    // any mutation in flight disables interaction + drives the row spinner
    const isMutating = courseEnrollSwr.isMutating
        || purchaseAiSubscriptionSwr.isMutating
        || purchaseMembershipSwr.isMutating

    // the loading / error state of the price source for the active flow
    const priceLoading = (isCourse && !coursePriceSwr.data && !coursePriceSwr.error)
        || (isAi && !aiTiersSwr.data && !aiTiersSwr.error)
    const priceError = isCourse
        ? coursePriceSwr.error
        : isAi
            ? aiTiersSwr.error
            : undefined

    // unified order summary derived per flow
    const order = useMemo<PaymentOrder | null>(() => {
        if (!context) {
            return null
        }
        if (context.flow === PaymentFlow.CourseEnroll) {
            const price = coursePriceSwr.data
            return {
                name: course?.title ?? "",
                priceVnd: price?.discountedPriceVnd,
                originalVnd: price?.originalPriceVnd,
                phaseVnd: price?.phasePriceVnd,
                priceUsd: price?.discountedPriceUsd ?? null,
                originalUsd: price?.originalPriceUsd ?? null,
                phaseUsd: price?.phasePriceUsd ?? null,
                discountPercent: price?.discountPercent ?? 0,
                discountReason: price?.discountReason ?? "none",
                enrolledCount: price?.enrolledCount ?? 0,
            }
        }
        if (context.flow === PaymentFlow.AiSubscription) {
            return {
                name: aiTier?.displayName ?? t("payment.aiPlanName"),
                priceVnd: aiTier?.priceVnd,
                priceUsd: aiTier?.priceUsd ?? null,
                discountPercent: 0,
                discountReason: "none",
                enrolledCount: 0,
            }
        }
        // membership — single product, price from i18n config copy
        return {
            name: t("payment.membershipName"),
            discountPercent: 0,
            discountReason: "none",
            enrolledCount: 0,
            priceUsd: null,
        }
    }, [context, coursePriceSwr.data, aiTier, course?.title, t])

    // whether international (USD) gateways are usable for this order
    const hasUsd = isMembership || (order?.priceUsd != null)
    // the effective currency (clamped to VND when no USD price exists)
    const activeCurrency: PriceCurrency = hasUsd ? currency : "VND"
    const isUsd = activeCurrency === "USD"

    // method groups, each carrying its currency
    const paymentGroups = useMemo(
        () => [
            {
                id: "domestic",
                label: t("payment.group.domestic"),
                currency: "VND",
                methods: [
                    { type: PaymentType.PayOS, name: "PayOS", description: t("payment.payos.desc"), iconUrl: assetConfig().icon().payment().payos },
                    { type: PaymentType.Sepay, name: "Sepay", description: t("payment.sepay.desc"), iconUrl: assetConfig().icon().payment().sepay },
                ],
            },
            {
                id: "international",
                label: t("payment.group.international"),
                currency: "USD",
                methods: [
                    { type: PaymentType.Stripe, name: "Stripe", description: t("payment.stripe.desc"), iconUrl: assetConfig().icon().payment().stripe },
                    { type: PaymentType.Paypal, name: "PayPal", description: t("payment.paypal.desc"), iconUrl: assetConfig().icon().payment().paypal },
                    { type: PaymentType.Crypto, name: "Crypto", description: t("payment.crypto.desc"), iconUrl: assetConfig().icon().payment().crypto },
                ],
            },
        ],
        [t],
    )

    /**
     * Loyalty breakdown rows (course flow) — explains WHY the discount applies, not just the %.
     * Reads the BE `discountReason` + `enrolledCount`: enrolled-count bonus (+5%/owned course)
     * and/or the diligent bonus (streak/points). Renders one row per active reason.
     */
    const loyaltyReasons = (reason: DiscountReason, enrolledCount: number) => {
        const rows: Array<{ key: string, icon: React.ReactNode, label: string }> = []
        if (reason === "enrolledCount" || reason === "both") {
            rows.push({
                key: "enrolled",
                icon: <GraduationCapIcon aria-hidden focusable="false" className="size-4 text-success" />,
                label: t("payment.loyalty.enrolled", { count: enrolledCount }),
            })
        }
        if (reason === "diligent" || reason === "both") {
            rows.push({
                key: "diligent",
                icon: <FlameIcon aria-hidden focusable="false" className="size-4 text-success" />,
                label: t("payment.loyalty.diligent"),
            })
        }
        return rows
    }

    /**
     * Run the purchase for the active flow with the chosen method, then send the user
     * to the gateway (or the Sepay QR page).
     */
    const runCheckout = async (paymentType: PaymentType) => {
        if (!context) {
            return
        }
        let checkoutUrl = ""
        let checkoutFields: string | null | undefined
        setSelectedPaymentMethod(paymentType)
        const success = await runGraphQL(
            async () => {
                if (context.flow === PaymentFlow.CourseEnroll) {
                    const response = await courseEnrollSwr.trigger({
                        courseId: course?.id ?? "",
                        paymentType,
                        payosReturnUrl: window.location.href,
                        payosCancelUrl: window.location.href,
                    })
                    if (!response.data?.courseEnroll) {
                        throw new Error(response.error?.message)
                    }
                    const data = response.data.courseEnroll.data
                    checkoutUrl = data?.checkoutUrl ?? ""
                    checkoutFields = data?.checkoutFields
                    return response.data.courseEnroll
                }
                if (context.flow === PaymentFlow.Membership) {
                    const response = await purchaseMembershipSwr.trigger({
                        paymentType,
                        payosReturnUrl: window.location.href,
                        payosCancelUrl: window.location.href,
                    })
                    if (!response.data?.purchaseMembership) {
                        throw new Error(response.error?.message)
                    }
                    const data = response.data.purchaseMembership.data
                    checkoutUrl = data?.checkoutUrl ?? ""
                    checkoutFields = data?.checkoutFields
                    return response.data.purchaseMembership
                }
                const response = await purchaseAiSubscriptionSwr.trigger({
                    tier: context.tier,
                    paymentType,
                    payosReturnUrl: window.location.href,
                    payosCancelUrl: window.location.href,
                })
                if (!response.data?.purchaseAiSubscription) {
                    throw new Error(response.error?.message)
                }
                const data = response.data.purchaseAiSubscription.data
                checkoutUrl = data?.checkoutUrl ?? ""
                checkoutFields = data?.checkoutFields
                return response.data.purchaseAiSubscription
            },
            {
                showSuccessToast: false,
                showErrorToast: true,
            },
        )
        if (success && checkoutUrl) {
            submitCheckout({ checkoutUrl, checkoutFields })
        }
    }

    const activeGroup = isUsd
        ? paymentGroups.find((group) => group.id === "international")
        : paymentGroups.find((group) => group.id === "domestic")

    // summary price in the active currency
    const summaryDiscounted = isUsd ? order?.priceUsd : order?.priceVnd
    const summaryOriginal = isUsd ? order?.originalUsd : order?.originalVnd
    const summaryPhase = isUsd ? order?.phaseUsd : order?.phaseVnd

    /**
     * One gateway as an INTERACTIVE LIST-CARD row — accordion-surface skin: the parent
     * list owns `bg-surface`/border/radius, each row is a `<button>` with the accordion
     * hover tint (`bg-default`), inset separator (hidden on the last row), focus ring and
     * disabled state. Amount shown in the active currency.
     */
    const renderMethodRow = (
        method: { type: PaymentType, name: string, description: string, iconUrl: string },
    ) => {
        const amountLabel = isUsd
            ? (order?.priceUsd != null ? formatUsd(order.priceUsd) : null)
            : (order?.priceVnd != null ? formatVnd(order.priceVnd) : null)
        const rowPending = isMutating && selectedPaymentMethod === method.type
        return (
            <button
                key={method.type}
                type="button"
                disabled={isMutating}
                onClick={() => { void runCheckout(method.type) }}
                className="relative flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 after:absolute after:bottom-0 after:left-[3%] after:h-px after:w-[94%] after:bg-surface-foreground/6 after:content-[''] last:after:hidden"
            >
                <img
                    alt={method.name}
                    className="h-8 w-12 shrink-0 object-contain object-left"
                    src={method.iconUrl}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                    <Typography type="body-sm" weight="semibold">{method.name}</Typography>
                    <Typography type="body-xs" color="muted" truncate>{method.description}</Typography>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {amountLabel ? (
                        <Typography type="body-xs" color="muted">{amountLabel}</Typography>
                    ) : null}
                    {rowPending ? (
                        <Spinner size="sm" />
                    ) : (
                        <ArrowRightIcon aria-hidden focusable="false" className="size-5 text-muted" />
                    )}
                </div>
            </button>
        )
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container size="sm">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Typography type="body" weight="semibold">{t("payment.title")}</Typography>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-3">
                                {/* summary — FLAT (no card frame): IconTile + name + price (PriceTag with
                                    hover breakdown) + loyalty breakdown, on the modal surface. */}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <IconTile
                                            size="sm"
                                            tone="accent"
                                            icon={<GraduationCapIcon />}
                                            src={isCourse ? coverImageUrl : undefined}
                                            alt={order?.name ?? ""}
                                        />
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <Typography type="body-xs" color="muted" truncate title={order?.name}>
                                                {order?.name}
                                            </Typography>
                                            <AsyncContent
                                                isLoading={Boolean(priceLoading)}
                                                skeleton={<div className="mt-1 h-6 w-28 animate-pulse rounded-lg bg-default" />}
                                                error={priceError}
                                                errorContent={{ title: t("payment.priceError") }}
                                            >
                                                {summaryDiscounted != null ? (
                                                    <PriceTag
                                                        discounted={summaryDiscounted}
                                                        original={summaryOriginal}
                                                        currency={activeCurrency}
                                                        size="md"
                                                        breakdown={summaryPhase != null ? {
                                                            phase: summaryPhase,
                                                            loyaltyPercent: order?.discountPercent ?? 0,
                                                        } : undefined}
                                                    />
                                                ) : isMembership ? (
                                                    <Typography type="h4" weight="bold">{t("membership.price")}</Typography>
                                                ) : null}
                                            </AsyncContent>
                                        </div>
                                    </div>
                                    {/* loyalty breakdown — WHY the discount applies (discountReason + enrolledCount) */}
                                    {order && order.discountPercent > 0
                                        && loyaltyReasons(order.discountReason, order.enrolledCount).length > 0 ? (
                                            <div className="mt-2 flex flex-col gap-1">
                                                {loyaltyReasons(order.discountReason, order.enrolledCount).map((row) => (
                                                    <div key={row.key} className="flex items-center gap-2">
                                                        {row.icon}
                                                        <Typography type="body-xs" color="muted">{row.label}</Typography>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                </div>

                                {/* currency / region toggle — drives the summary price + gateway list.
                                    Only shown when the order HAS a USD price (a real choice exists). */}
                                {hasUsd ? (
                                    <SegmentedControl<PriceCurrency>
                                        ariaLabel={t("payment.title")}
                                        value={activeCurrency}
                                        onChange={setCurrency}
                                        items={[
                                            { value: "VND", label: t("payment.currency.vnd") },
                                            { value: "USD", label: t("payment.currency.usd") },
                                        ]}
                                    />
                                ) : null}

                                {/* gateways for the active currency — interactive list card */}
                                {activeGroup ? (
                                    <LabeledCard
                                        label={activeGroup.label}
                                        labelEnd={activeGroup.currency}
                                        frameless
                                    >
                                        <div className="overflow-hidden rounded-3xl border border-default bg-surface">
                                            {activeGroup.methods.map((method) => renderMethodRow(method))}
                                        </div>
                                    </LabeledCard>
                                ) : null}

                                {/* trust line — secure-payment reassurance next to the action (Baymard) */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center justify-center gap-2">
                                        <LockSimpleIcon aria-hidden focusable="false" className="size-5 text-muted" />
                                        <Typography type="body-xs" color="muted">{t("payment.secure")}</Typography>
                                    </div>
                                    <Typography type="body-xs" color="muted">{t("payment.noCardStored")}</Typography>
                                </div>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
