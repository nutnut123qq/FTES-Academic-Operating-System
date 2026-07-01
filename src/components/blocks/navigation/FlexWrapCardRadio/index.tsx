"use client"

import React from "react"
import type { ReactNode } from "react"
import { Radio, RadioGroup, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Selected-state colour token for the cards. */
export type FlexWrapCardRadioColor = "accent" | "success" | "danger" | "warning"

/**
 * Literal selected-state classes per colour. Spelled out (not interpolated) so
 * Tailwind can see and build them.
 */
const SELECTED_CLASS: Record<FlexWrapCardRadioColor, string> = {
    accent: "border-accent bg-accent/10",
    success: "border-success bg-success/10",
    danger: "border-danger bg-danger/10",
    warning: "border-warning bg-warning/10",
}

/** One selectable card in a {@link FlexWrapCardRadio}. */
export interface FlexWrapCardRadioItem<T extends string> {
    /** Value selected when this card is chosen. */
    value: T
    /** Card content (icon + label + meta — caller-defined inline row). */
    content: ReactNode
    /** When true the card is dimmed and not selectable. */
    isDisabled?: boolean
}

/** Props for the {@link FlexWrapCardRadio} block. */
export interface FlexWrapCardRadioProps<T extends string> extends WithClassNames<undefined> {
    /** The selectable cards. */
    items: Array<FlexWrapCardRadioItem<T>>
    /** Currently selected value. */
    value: T
    /** Fired with the chosen value when a card is selected. */
    onChange: (value: T) => void
    /** Accessible label for the radio group. */
    ariaLabel: string
    /** Selected-state colour. Defaults to `accent`. */
    color?: FlexWrapCardRadioColor
    /**
     * Optional trailing node placed after the cards in the SAME wrap row (e.g. a
     * "+N" overflow card). Not part of the radio group — it's an action, not a value.
     */
    trailing?: ReactNode
}

/**
 * A single-select group of surface cards laid out as a flex-wrap row (cards wrap
 * to the next line, never scroll). Choosing one lights it up (`bg-<color>/10` +
 * matching border) while the text stays neutral. Built on HeroUI `RadioGroup`/
 * `Radio` (React Aria) — a real radio group (arrow-key roving, single-select,
 * focus ring), not a hand-rolled toggle grid.
 *
 * The `RadioGroup` is `display: contents` so each card is a direct flex child of
 * the wrap row — that lets the optional `trailing` card (e.g. "+N more") flow and
 * wrap alongside the radios while staying outside the group semantically.
 *
 * The visible card is an inner `<div>` styled off the `Radio` render-prop state
 * (`isSelected`/`isDisabled`/`isFocusVisible`); the `Radio` root keeps its own
 * unlayered `.radio` base, so utilities never fight it.
 *
 * Pick this for a compact "choose one of N" where boxed surface cards wrap. For a
 * lighter pill switch use `FlexWrapButtonRadio`; for a grid of larger cards with
 * description/badge use `SelectableCardGroup`.
 *
 * @param props - {@link FlexWrapCardRadioProps}
 */
export const FlexWrapCardRadio = <T extends string>({
    items,
    value,
    onChange,
    ariaLabel,
    color = "accent",
    trailing,
    className,
}: FlexWrapCardRadioProps<T>) => (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            <RadioGroup
                aria-label={ariaLabel}
                value={value}
                onChange={(next) => onChange(next as T)}
                className="contents"
            >
                {items.map((item) => (
                    <Radio key={item.value} value={item.value} isDisabled={item.isDisabled}>
                        {({ isSelected, isDisabled, isFocusVisible }) => (
                            <div
                                className={cn(
                                    "flex items-center gap-2 rounded-xl border bg-surface px-3 py-2 text-sm text-foreground transition-colors",
                                    isSelected ? cn(SELECTED_CLASS[color], "font-medium") : "border-default",
                                    !isSelected && !isDisabled && "hover:bg-default",
                                    isDisabled && "opacity-60",
                                    isFocusVisible && "ring-2 ring-accent",
                                )}
                            >
                                {item.content}
                            </div>
                        )}
                    </Radio>
                ))}
            </RadioGroup>
            {trailing}
        </div>
    )
