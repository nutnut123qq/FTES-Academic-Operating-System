"use client"

import React from "react"
import { cn, Typography, Chip } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SectionCard } from "@/components/reuseable/SectionCard"

/** Props for {@link PricingCard}. */
export interface PricingCardProps extends WithClassNames<undefined> {
    /** Display name of the pricing tier (e.g. "Pro", "Enterprise"). */
    name: React.ReactNode
    /**
     * The current price to display prominently (e.g. "$9" or a formatted node).
     * Rendered large in the price row.
     */
    price: React.ReactNode
    /**
     * Optional original / strike-through price shown alongside the current price
     * to indicate a discount (e.g. "$19"). Omit when there is no original price.
     */
    originalPrice?: React.ReactNode
    /**
     * Billing period label rendered muted next to the price (e.g. "/tháng",
     * "/month"). Omit if not applicable.
     */
    period?: React.ReactNode
    /**
     * Feature list node — typically a `<ul>` with bullet items. Passed in as-is
     * so callers control the exact markup and icons.
     */
    features: React.ReactNode
    /**
     * Call-to-action element — pass a fully configured `<Button>` from HeroUI.
     * The block pins it to the bottom of the card via flex layout.
     */
    cta: React.ReactNode
    /**
     * Optional badge label shown above the tier name to call out a popular or
     * recommended tier (e.g. "Phổ biến", "Best value"). Omit to hide the badge row.
     */
    badge?: React.ReactNode
    /**
     * When true the card renders with SectionCard's accent variant
     * (tinted border + background) and the badge is visible.
     * Use this on the recommended / most popular tier.
     */
    highlighted?: boolean
}

/**
 * Pricing tier card — a tier-3 presentational block that renders one pricing
 * plan with a name, price row, feature list, and a CTA button.
 *
 * Built on {@link SectionCard} with the `accent` variant when `highlighted` is
 * true. All content is received as `ReactNode` props so the caller controls
 * formatting, currency, and button configuration.
 *
 * @example
 * ```tsx
 * <PricingCard
 *     name="Pro"
 *     price="$9"
 *     originalPrice="$19"
 *     period="/month"
 *     features={<ul><li>Feature A</li></ul>}
 *     cta={<Button color="accent">Get started</Button>}
 *     badge="Most popular"
 *     highlighted
 * />
 * ```
 *
 * @param props - {@link PricingCardProps}
 */
export const PricingCard = ({
    name,
    price,
    originalPrice,
    period,
    features,
    cta,
    badge,
    highlighted = false,
    className,
}: PricingCardProps) => {
    return (
        // Use SectionCard's accent variant for the highlighted (recommended) tier
        <SectionCard
            accent={highlighted}
            className={cn("flex flex-col", className)}
            contentClassName="flex flex-col gap-6 h-full"
        >
            {/* Badge + name header */}
            <div className="flex flex-col gap-1.5">
                {/* Only render the badge slot when the card is highlighted and a badge is provided */}
                {highlighted && badge ? (
                    <Chip size="sm" variant="soft" color="accent">
                        <Chip.Label>{badge}</Chip.Label>
                    </Chip>
                ) : null}

                {/* Tier name — heading level 3 suits a plan name semantically */}
                <Typography.Heading level={3}>
                    {name}
                </Typography.Heading>
            </div>

            {/* Price row: big price + optional struck original + muted period */}
            <div className="flex flex-wrap items-baseline gap-1.5">
                {/* Main price — h3 size, semibold, prominent */}
                <Typography type="h3" weight="semibold">
                    {price}
                </Typography>

                {/* Strike-through original price — line-through is text-decoration, allowed as className */}
                {originalPrice ? (
                    <Typography type="body-sm" color="muted" className="line-through">
                        {originalPrice}
                    </Typography>
                ) : null}

                {/* Billing period label — smallest muted text */}
                {period ? (
                    <Typography type="body-xs" color="muted">
                        {period}
                    </Typography>
                ) : null}
            </div>

            {/* Feature list — grows to fill available vertical space; caller controls markup */}
            <div className="flex-1">{features}</div>

            {/* CTA pinned to the bottom of the card */}
            <div>{cta}</div>
        </SectionCard>
    )
}
