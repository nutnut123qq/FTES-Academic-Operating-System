"use client"

import { SealCheckIcon } from "@phosphor-icons/react"
import React, {
    useCallback,
} from "react"
import {
    cn,
    Button,
    Card,
    Chip,
    Spinner,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    formatVnd,
    formatUsd,
} from "../../utils"
import type { AiSubscriptionTier } from "@/modules/api/graphql/queries/types/ai-subscription-tiers"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { PaymentFlow } from "@/modules/types/payment"
import { type WithClassNames } from "@/modules/types/base/class-name"
import { TierLevelIcon } from "@/components/svg/TierLevelIcon"

/** Props for {@link TierCard} (list item — per-item tier data only). */
export interface TierCardProps extends WithClassNames<undefined> {
    /** Tier this card represents. */
    tier: AiSubscriptionTier
    /** Whether this tier is the user's current plan. */
    isCurrent: boolean
}

/**
 * One purchasable AI subscription tier card.
 *
 * List item: receives its own tier data + current flag; self-opens the shared
 * payment overlay for the buy action via {@link usePaymentOverlayState}.
 * Uses the HeroUI `Card` (surface color, no shadow per global, `rounded-3xl`);
 * the popular tier gets an accent border + ring.
 * @param props - tier, current state
 */
export const TierCard = ({
    tier,
    isCurrent,
    className,
}: TierCardProps) => {
    const t = useTranslations()
    const { open: openPaymentModal } = usePaymentOverlayState()

    const onPress = useCallback(
        () => {
            openPaymentModal({
                flow: PaymentFlow.AiSubscription,
                tier: tier.tier,
            })
        },
        [
            tier.tier,
            openPaymentModal,
        ],
    )
    // ascending tier level — Plus=2, Pro=3, Max=4 (highlighted bars)
    const tierLevel = tier.tier === "max"
        ? 4
        : tier.tier === "pro"
            ? 3
            : 2
    return (
        <Card
            className={cn(
                "flex h-full flex-col",
                tier.popular ? "border-accent ring-2 ring-accent/30" : "",
                className,
            )}
        >
            <Card.Content className="flex flex-1 flex-col gap-3">
                {/* icon + tier name (+ popular chip) — tight pair */}
                <div className="flex items-center gap-2">
                    <TierLevelIcon
                        level={tierLevel}
                        className="size-6 shrink-0 text-accent"
                    />
                    <Typography type="h5" weight="semibold">
                        {tier.displayName}
                    </Typography>
                    {tier.popular ? (
                        <Chip
                            size="sm"
                            color="accent"
                            variant="soft"
                        >
                            <Chip.Label>{t("aiSubscription.popular")}</Chip.Label>
                        </Chip>
                    ) : null}
                </div>
                {/* short tagline — fixed three-line slot so cards align with free tier */}
                <div className="h-[2lh]">
                    <Typography type="body-sm" color="muted" className="line-clamp-3">
                        {tier.description ?? ""}
                    </Typography>
                </div>
                {/* price block — VND number prominent + "/tháng" + USD hint */}
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                        <Typography type="h3" weight="bold">
                            {formatVnd(tier.priceVnd)}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("aiSubscription.perMonth")}
                        </Typography>
                    </div>
                    {/* secondary USD line — what international gateways charge */}
                    <div className="h-[3lh]">
                        <Typography type="body-sm" color="muted">
                            {t("aiSubscription.priceUsdHint", { amount: formatUsd(tier.priceUsd) })}
                        </Typography>
                    </div>
                </div>
                {isCurrent ? (
                    <div className="flex w-full items-center justify-center rounded-3xl bg-success/10 px-3 py-2">
                        <Typography type="body-sm" weight="medium" className="text-success">
                            {t("aiSubscription.currentPlan")}
                        </Typography>
                    </div>
                ) : (
                    <Button
                        variant="primary"
                        fullWidth
                        onPress={onPress}
                    >
                        {({ isPending }) => (
                            <>
                                {isPending ? (
                                    <Spinner
                                        color="current"
                                        size="sm"
                                    />
                                ) : null}
                                {t("aiSubscription.buy")}
                            </>
                        )}
                    </Button>
                )}
            </Card.Content>
            <Card.Footer>
                {/* feature list — seal-check icon + muted text */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <SealCheckIcon
                            aria-hidden
                            className="size-5 shrink-0 text-muted"
                        />
                        <Typography type="body-sm" color="muted">
                            {t("aiSubscription.creditsPer5h", { credits: tier.creditsPer5h })}
                        </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                        <SealCheckIcon
                            aria-hidden
                            className="size-5 shrink-0 text-muted"
                        />
                        <Typography type="body-sm" color="muted">
                            {t("aiSubscription.creditsPerWeek", { credits: tier.creditsPerWeek })}
                        </Typography>
                    </div>
                </div>
            </Card.Footer>
        </Card>
    )
}
