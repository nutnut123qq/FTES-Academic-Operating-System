"use client"

import React from "react"
import {
    Typography,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    CheckCircleIcon,
    CircleIcon,
} from "@phosphor-icons/react"
import {
    PHASE_LABEL_KEY,
} from "../../constants"
import type {
    CoursePriceRow,
} from "../../types"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link PhaseRow}. */
export interface PhaseRowProps extends WithClassNames<undefined> {
    /** One formatted pricing-phase row (list-item data prop). */
    row: CoursePriceRow
}

/**
 * One step in the price ladder — a single signal per row, no chip soup: a state
 * dot (sold-out ✓ / current ● / upcoming ○) + the phase name, and on the right
 * either a state label (sold-out / open now) or the phase price. The current
 * price + scarcity + discount live ONCE in the rail headline, so the current row
 * shows no price here.
 *
 * @param props - {@link PhaseRowProps}
 */
export const PhaseRow = ({ row, className }: PhaseRowProps) => {
    const t = useTranslations()

    return (
        <div className={cn("flex items-center justify-between gap-3", className)}>
            <div className="flex min-w-0 items-center gap-2">
                {row.soldOut ? (
                    <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-4 shrink-0 text-muted" />
                ) : row.isActive ? (
                    <CircleIcon aria-hidden focusable="false" weight="fill" className="size-4 shrink-0 text-accent" />
                ) : (
                    <CircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                )}
                <Typography
                    type="body-sm"
                    weight={row.isActive ? "semibold" : "normal"}
                    color={row.soldOut ? "muted" : "default"}
                    className={row.isActive ? "text-accent" : undefined}
                    truncate
                >
                    {t(PHASE_LABEL_KEY[row.phase])}
                </Typography>
            </div>
            {row.soldOut ? (
                <Typography type="body-xs" color="muted">
                    {t("courseLanding.soldOut")}
                </Typography>
            ) : row.isActive ? (
                <Typography type="body-xs" className="text-accent">
                    {t("courseLanding.currentOpen")}
                </Typography>
            ) : (
                <Typography type="body-sm" weight="medium">
                    {row.formattedPrice}
                </Typography>
            )}
        </div>
    )
}
