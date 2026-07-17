"use client"

import React from "react"
import type { ReactNode } from "react"
import { Radio, RadioGroup, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One selectable card in a {@link SelectableCardGroup}. */
export interface SelectableCardItem<T extends string> {
    /** Value selected when this card is chosen. */
    value: T
    /** Primary label (text / icon + text). */
    label: ReactNode
    /** Optional secondary line under the label. */
    description?: ReactNode
    /** Optional leading icon (rendered decorative). */
    icon?: ReactNode
    /** When true the card is dimmed and not selectable. */
    isDisabled?: boolean
    /** Optional trailing node (e.g. a "coming soon" tag) shown on the right. */
    badge?: ReactNode
}

/** Props for the {@link SelectableCardGroup} block. */
export interface SelectableCardGroupProps<T extends string> extends WithClassNames<undefined> {
    /** The selectable cards (2+). */
    items: Array<SelectableCardItem<T>>
    /** Currently selected value. */
    value: T
    /** Fired with the chosen value when a card is selected. */
    onChange: (value: T) => void
    /** Accessible label for the group. */
    ariaLabel: string
    /** Grid column count (only for `variant="card"`). Defaults to `2`. */
    columns?: 1 | 2 | 3
    /**
     * `"card"` (default): each option is its own bordered surface card, gapped.
     * `"list"`: one bordered container of connected rows split by dividers (no
     * per-row border/gap) — a single object, not a stack of cards.
     * `"plain"`: bare rows with NO container border, NO per-row box/fill — the
     * selected row is signalled by ACCENT TEXT only (radio + label go accent).
     * Tightest option; use for a pricing/package ladder.
     */
    variant?: "card" | "list" | "plain"
    /**
     * Tightens each row's vertical padding (`py-2.5` instead of `py-3`) so a
     * `"list"` group reads as a compact one-line ladder (e.g. a pricing/package
     * picker). No effect on `"card"`.
     */
    compact?: boolean
}

/** Tailwind grid-template class per supported column count. */
const COLUMNS_CLASS: Record<1 | 2 | 3, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
}

/**
 * A single-select group of surface cards: each option is a bounded `bg-surface`
 * card; choosing one lights it up (`bg-accent/10` + accent border) while the text
 * stays neutral (`text-foreground`). Built on HeroUI `RadioGroup`/`Radio` (React
 * Aria) so it is a real radio group — arrow-key roving, single-select semantics,
 * focus ring — not a hand-rolled toggle-button grid.
 *
 * The visible card is an inner `<div>` styled off the `Radio` render-prop state
 * (`isSelected`/`isDisabled`/`isFocusVisible`); the `Radio` root keeps its own
 * unlayered `.radio` base, so utilities never fight it.
 *
 * Pick this for a larger "choose one of N cards" with icon / description / badge.
 * For a compact pill switch use `SegmentedControl`; for section navigation use
 * `TabsCard`.
 *
 * @param props - {@link SelectableCardGroupProps}
 */
export const SelectableCardGroup = <T extends string>({
    items,
    value,
    onChange,
    ariaLabel,
    columns = 2,
    variant = "card",
    compact = false,
    className,
}: SelectableCardGroupProps<T>) => (
        <RadioGroup
            aria-label={ariaLabel}
            value={value}
            onChange={(next) => onChange(next as T)}
            className={cn(
                variant === "list"
                    ? "flex flex-col divide-y divide-separator overflow-hidden rounded-2xl border border-default"
                    : variant === "plain"
                        ? "flex flex-col"
                        : cn("grid gap-2", COLUMNS_CLASS[columns]),
                className,
            )}
        >
            {items.map((item) => (
                <Radio key={item.value} value={item.value} isDisabled={item.isDisabled} className="w-full">
                    {({ isSelected, isDisabled, isFocusVisible }) => (
                        <div
                            className={cn(
                                "flex w-full items-center gap-2 text-sm transition-colors",
                                variant === "plain" ? "px-1" : "px-3",
                                variant === "plain" ? "py-1" : compact && variant === "list" ? "py-2.5" : "py-3",
                                // card: standalone bordered surface; list: flat connected row with
                                // an accent fill; plain: NO box — selected row is signalled by accent
                                // text only (label inherits currentColor → turns accent).
                                variant === "list"
                                    ? cn(isSelected ? "bg-accent/10 font-medium" : "text-foreground")
                                    : variant === "plain"
                                        ? cn(isSelected ? "font-semibold text-accent" : "text-foreground")
                                        : cn(
                                            "rounded-xl border bg-surface text-foreground",
                                            isSelected ? "border-accent bg-accent/10 font-medium" : "border-default",
                                        ),
                                !isSelected && !isDisabled && (variant === "plain" ? "hover:text-foreground/70" : "hover:bg-default"),
                                isDisabled && "opacity-60",
                                isFocusVisible && (variant === "plain"
                                    ? "rounded-lg ring-2 ring-accent"
                                    : variant === "list" ? "ring-2 ring-inset ring-accent" : "ring-2 ring-accent"),
                            )}
                        >
                            {item.icon ? (
                                <span className="shrink-0" aria-hidden>
                                    {item.icon}
                                </span>
                            ) : null}
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate">{item.label}</span>
                                {item.description ? (
                                    <span className="truncate text-xs text-muted">{item.description}</span>
                                ) : null}
                            </span>
                            {item.badge ? <span className="ml-auto shrink-0">{item.badge}</span> : null}
                        </div>
                    )}
                </Radio>
            ))}
        </RadioGroup>
    )
