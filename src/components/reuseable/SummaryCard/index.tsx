"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    ChevronRight as ChevronRightIcon,
} from "@gravity-ui/icons"
import {
    PressableCard,
} from "../PressableCard"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link SummaryCard}. */
export interface SummaryCardProps extends WithClassNames<undefined> {
    /** Leading icon for the metric. */
    icon: React.ReactNode
    /** Headline value (e.g. a count). */
    value: React.ReactNode
    /** Short label under the value. */
    label: React.ReactNode
    /** Optional one-line hint under the label. */
    hint?: React.ReactNode
    /** Called when the card is activated (e.g. jump to a tab). */
    onPress?: () => void
}

/**
 * A compact pressable metric card (icon + big value + label, with a trailing
 * chevron) used in the profile overview to surface a deeper tab. Built on
 * {@link PressableCard} for the spring/hover feel; carries the bordered "viền"
 * look via `card card--default`. Presentational — the caller wires `onPress`.
 *
 * @param props - {@link SummaryCardProps}
 */
export const SummaryCard = ({
    icon,
    value,
    label,
    hint,
    onPress,
    className,
}: SummaryCardProps) => {
    return (
        <PressableCard
            onPress={onPress}
            className={cn(
                "card card--default flex h-full w-full flex-col gap-3 rounded-xl border border-divider/60 p-4 transition-colors",
                "hover:border-accent/40 hover:bg-accent/5",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <span className="text-accent">{icon}</span>
                <ChevronRightIcon className="size-5 text-muted" />
            </div>
            <div className="flex flex-col gap-0">
                <span className="text-2xl font-bold leading-tight text-foreground">
                    {value}
                </span>
                <span className="text-sm font-medium text-foreground">{label}</span>
                {hint ? <span className="text-xs text-muted">{hint}</span> : null}
            </div>
        </PressableCard>
    )
}
