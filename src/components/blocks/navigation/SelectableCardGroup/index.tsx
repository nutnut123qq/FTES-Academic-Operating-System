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
    /** Grid column count. Defaults to `2`. */
    columns?: 1 | 2 | 3
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
    className,
}: SelectableCardGroupProps<T>) => (
        <RadioGroup
            aria-label={ariaLabel}
            value={value}
            onChange={(next) => onChange(next as T)}
            className={cn("grid gap-2", COLUMNS_CLASS[columns], className)}
        >
            {items.map((item) => (
                <Radio key={item.value} value={item.value} isDisabled={item.isDisabled} className="w-full">
                    {({ isSelected, isDisabled, isFocusVisible }) => (
                        <div
                            className={cn(
                                "flex w-full items-center gap-2 rounded-xl border bg-surface px-3 py-3 text-sm text-foreground transition-colors",
                                isSelected ? "border-accent bg-accent/10 font-medium" : "border-default",
                                !isSelected && !isDisabled && "hover:bg-default",
                                isDisabled && "opacity-60",
                                isFocusVisible && "ring-2 ring-accent",
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
