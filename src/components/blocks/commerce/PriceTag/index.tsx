"use client"

import React from "react"
import { Chip, Tooltip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Currency a price is shown in. */
export type PriceCurrency = "VND" | "USD"

/** Visual size of the price (drives the discounted amount's type scale). */
export type PriceTagSize = "sm" | "md" | "lg"

/** Breakdown rows for the hover tooltip (amounts in the SAME currency as the price). */
export interface PriceBreakdown {
    /** Active-phase price BEFORE loyalty (the middle step list → phase → charge). */
    phase: number
    /** Localised phase name (e.g. "Early-bird") shown on the phase row. */
    phaseLabel?: string
    /** Loyalty discount percent (0 = no loyalty row). */
    loyaltyPercent: number
    /** Localised loyalty note (e.g. "đã sở hữu 2 khóa") appended to the loyalty row. */
    loyaltyNote?: string
}

/** Props for the {@link PriceTag} block. */
export interface PriceTagProps extends WithClassNames<undefined> {
    /** The price the user actually pays. */
    discounted: number
    /** The pre-discount (list/MSRP) price; struck through when greater than discounted. */
    original?: number | null
    /** Currency to format in. Defaults to "VND". */
    currency?: PriceCurrency
    /** Size of the discounted amount. Defaults to "md". */
    size?: PriceTagSize
    /**
     * When provided, the price becomes hoverable (cursor-help + ⓘ) and shows a
     * tooltip breaking the saving into phase tier + loyalty → "you pay".
     */
    breakdown?: PriceBreakdown
}

/** size → discounted-amount type. */
const AMOUNT_TYPE: Record<PriceTagSize, "body" | "h4" | "h3"> = {
    sm: "body",
    md: "h4",
    lg: "h3",
}

/** Format an amount in the given currency. */
const formatPrice = (amount: number, currency: PriceCurrency): string =>
    currency === "USD"
        ? amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
        : `${amount.toLocaleString("vi-VN")}₫`

/** Whole-percent saving between a "before" and an "after" amount (0 when none). */
const savingPercent = (before: number, after: number): number =>
    before > after ? Math.round((1 - after / before) * 100) : 0

/**
 * The single source of truth for rendering a course/product price: the discounted
 * amount (bold), the list price struck through (only when there IS a saving), and a
 * `−X%` success chip whose percent is the REAL list → charge gap (phase tier +
 * loyalty), not a loyalty flag. Optionally hoverable — `breakdown` shows why the
 * price dropped (phase + loyalty → you pay). Works in VND or USD. Use everywhere a
 * price is shown so the discount logic never drifts between copies.
 *
 * @param props - {@link PriceTagProps}
 */
export const PriceTag = ({
    discounted,
    original,
    currency = "VND",
    size = "md",
    breakdown,
    className,
}: PriceTagProps) => {
    const t = useTranslations()
    const hasSaving = original != null && original > discounted
    const savePercent = hasSaving ? savingPercent(original, discounted) : 0

    // the −X% chip — when a breakdown is given, hovering IT (not the whole row) opens
    // the price-breakdown tooltip (no extra ⓘ glyph; the chip IS the affordance).
    const chip = savePercent > 0 ? (
        <Chip size="sm" variant="soft" color="success">
            <Chip.Label>{`−${savePercent}%`}</Chip.Label>
        </Chip>
    ) : null

    // phase saving = list → phase ; loyalty saving = phase → charge
    const phaseSave = original != null ? savingPercent(original, breakdown?.phase ?? discounted) : 0
    const breakdownContent = breakdown ? (
        <div className="flex flex-col gap-1 p-1">
            <Typography type="body-xs" color="muted">
                {t("priceTag.breakdownTitle")}
            </Typography>
            <div className="flex items-center justify-between gap-4">
                <Typography type="body-sm">{t("priceTag.listPrice")}</Typography>
                <Typography type="body-sm">
                    {formatPrice(original ?? discounted, currency)}
                </Typography>
            </div>
            {original != null && original > breakdown.phase ? (
                <div className="flex items-center justify-between gap-4">
                    <Typography type="body-sm" color="muted">
                        {breakdown.phaseLabel
                            ? t("priceTag.phaseNamed", { phase: breakdown.phaseLabel })
                            : t("priceTag.phase")}
                    </Typography>
                    <Typography type="body-sm" className="text-success">
                        {`−${formatPrice(original - breakdown.phase, currency)} (−${phaseSave}%)`}
                    </Typography>
                </div>
            ) : null}
            {breakdown.loyaltyPercent > 0 && breakdown.phase > discounted ? (
                <div className="flex items-center justify-between gap-4">
                    <Typography type="body-sm" color="muted" className="min-w-0 truncate">
                        {breakdown.loyaltyNote
                            ? `${t("priceTag.loyalty")} · ${breakdown.loyaltyNote}`
                            : t("priceTag.loyalty")}
                    </Typography>
                    <Typography type="body-sm" className="shrink-0 text-success">
                        {`−${formatPrice(breakdown.phase - discounted, currency)} (−${breakdown.loyaltyPercent}%)`}
                    </Typography>
                </div>
            ) : null}
            <div className="mt-1 flex items-center justify-between gap-4 border-t border-default pt-1">
                <Typography type="body-sm" weight="semibold">{t("priceTag.youPay")}</Typography>
                <Typography type="body-sm" weight="semibold">{formatPrice(discounted, currency)}</Typography>
            </div>
        </div>
    ) : null

    return (
        <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
            <Typography type={AMOUNT_TYPE[size]} weight="bold">
                {formatPrice(discounted, currency)}
            </Typography>
            {hasSaving ? (
                <Typography
                    type={size === "sm" ? "body-xs" : "body-sm"}
                    color="muted"
                    className="line-through"
                >
                    {formatPrice(original, currency)}
                </Typography>
            ) : null}
            {chip && breakdownContent ? (
                <Tooltip>
                    <Tooltip.Trigger className="cursor-help">{chip}</Tooltip.Trigger>
                    <Tooltip.Content className="max-w-xs">{breakdownContent}</Tooltip.Content>
                </Tooltip>
            ) : chip}
        </div>
    )
}
