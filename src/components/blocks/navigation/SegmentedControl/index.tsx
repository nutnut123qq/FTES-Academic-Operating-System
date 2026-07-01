"use client"

import React from "react"
import type { ReactNode } from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One option of a {@link SegmentedControl}. */
export interface SegmentedControlItem<T extends string> {
    /** The value selected when this segment is pressed. */
    value: T
    /** Segment label (text / icon + text). */
    label: ReactNode
    /** When true the segment is shown dimmed and not pressable. */
    isDisabled?: boolean
}

/** Props for the {@link SegmentedControl} block. */
export interface SegmentedControlProps<T extends string> extends WithClassNames<undefined> {
    /** The selectable segments (2+). */
    items: Array<SegmentedControlItem<T>>
    /** Currently selected value. */
    value: T
    /** Fired with the new value when a segment is pressed. */
    onChange: (value: T) => void
    /** Accessible label for the group. */
    ariaLabel?: string
}

/**
 * A pill segmented control: a `bg-default` track holding equal-width segments, the
 * active one lifted onto a `bg-surface` chip. For a small mutually-exclusive choice
 * that drives content (e.g. a currency / region switch). The block owns the whole
 * look; the caller passes items + value + onChange only. Distinct from `TabsCard`
 * (underline tabs for navigating sections) — this is a compact inline switch.
 *
 * @param props - {@link SegmentedControlProps}
 */
export const SegmentedControl = <T extends string>({
    items,
    value,
    onChange,
    ariaLabel,
    className,
}: SegmentedControlProps<T>) => (
        <div role="group" aria-label={ariaLabel} className={cn("flex gap-1 rounded-2xl bg-default p-1", className)}>
            {items.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    disabled={item.isDisabled}
                    aria-pressed={value === item.value}
                    onClick={() => onChange(item.value)}
                    className={cn(
                        "flex-1 cursor-pointer rounded-xl px-3 py-2 text-center text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                        value === item.value ? "bg-surface font-medium" : "text-muted hover:text-foreground",
                        item.isDisabled && "cursor-not-allowed opacity-50 hover:text-muted",
                    )}
                >
                    {item.label}
                </button>
            ))}
        </div>
    )
