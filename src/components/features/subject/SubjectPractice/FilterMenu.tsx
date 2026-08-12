"use client"

import React from "react"
import type { ReactNode } from "react"
import type { Selection } from "@heroui/react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { Dropdown, Label, cn } from "@heroui/react"

/** One entry of a {@link FilterMenu}. */
export interface FilterMenuOption<T extends string> {
    /** Value reported to `onChange` when picked. */
    value: T
    /** Row label (also the trigger label once picked). */
    label: string
}

/** Props for {@link FilterMenu}. */
export interface FilterMenuProps<T extends string> {
    /**
     * Name of the facet ("Type", "Status", …). Shown on the trigger while the
     * selection is the neutral one, so an untouched control reads as a QUESTION
     * rather than as an answer nobody gave.
     */
    label: string
    /** Entries, neutral ("all") first by convention. */
    options: ReadonlyArray<FilterMenuOption<T>>
    /** Current value. */
    value: T
    /** Fired with the picked value. */
    onChange: (value: T) => void
    /**
     * The "no constraint" value, when the facet has one (`"all"`). Everything about
     * the trigger follows from it:
     *
     * - **given** (type, status) — neutral shows the facet NAME and plain styling;
     *   anything else shows the picked label in accent, so a short list always says
     *   why it is short.
     * - **omitted** (sort) — the facet can't be "off", so the trigger always shows
     *   its value and never takes the accent. Sorting reorders, it doesn't hide, and
     *   dressing it as an active filter would send people hunting for a filter to
     *   clear that was never applied.
     */
    neutralValue?: T
    /** Optional leading icon — use it where the value alone is ambiguous (e.g. sort). */
    icon?: ReactNode
}

/**
 * A compact single-select facet control: one bordered trigger that opens a menu.
 *
 * Replaces the row-of-pills idiom for facets whose options are MANY and rarely
 * changed — six type pills plus four status pills plus two sort pills cost four
 * stacked rows of chrome above the results, which is most of a phone screen before
 * a single challenge is visible. A menu spends one trigger's width instead and
 * pays it back only when the reader opens it.
 *
 * Pills still win where the options are FEW, stable and worth scanning at a glance
 * (the tag row on the challenge bank stays pills for exactly that reason) — this is
 * not a blanket replacement.
 *
 * Selection runs through the house single-select menu idiom (`selectionMode="single"`
 * + `Dropdown.ItemIndicator`, as in `LanguageDropdown`), so rows are real
 * `menuitemradio`s that announce which one is checked — a hand-drawn tick icon looks
 * the same and tells assistive tech nothing.
 *
 * @param props - {@link FilterMenuProps}
 */
export const FilterMenu = <T extends string>({
    label,
    options,
    value,
    onChange,
    neutralValue,
    icon,
}: FilterMenuProps<T>) => {
    const picked = options.find((option) => option.value === value)
    /** Narrowing = this facet HAS an off position and is not sitting on it. */
    const isNarrowing = neutralValue !== undefined && value !== neutralValue
    /** Show the facet name only while it is parked on its own off position. */
    const triggerLabel =
        neutralValue !== undefined && !isNarrowing ? label : (picked?.label ?? label)

    /**
     * Menu selection → `onChange`. Guards the two shapes react-aria can hand back that
     * carry no single pick: the `"all"` sentinel, and an empty set (a re-press of the
     * checked row). Both mean "nothing new was chosen", so the current value stands —
     * silently clearing the facet on a stray second press would be a filter the reader
     * never asked to drop.
     */
    const onSelectionChange = (keys: Selection) => {
        if (keys === "all") {
            return
        }
        const next = [...keys][0]
        if (next !== undefined) {
            onChange(String(next) as T)
        }
    }

    return (
        <Dropdown>
            <Dropdown.Trigger
                /* The accessible name must CONTAIN the visible text (WCAG 2.5.3 Label in
                   Name), or voice control fails: the trigger reads "Business" on screen
                   while "click Business" matches nothing. So once the trigger stops showing
                   the facet name, the name carries both halves. */
                aria-label={triggerLabel === label ? label : `${label}: ${triggerLabel}`}
                className={cn(
                    "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                    isNarrowing
                        ? "border-accent bg-accent/10 font-medium text-accent"
                        : "border-separator text-muted hover:text-foreground",
                )}
            >
                <div className="flex items-center gap-1.5">
                    {icon}
                    <span className="max-w-32 truncate">{triggerLabel}</span>
                    <CaretDownIcon aria-hidden focusable="false" className="size-3.5" />
                </div>
            </Dropdown.Trigger>
            <Dropdown.Popover className="min-w-44">
                <Dropdown.Menu
                    aria-label={label}
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={new Set([value])}
                    onSelectionChange={onSelectionChange}
                >
                    <Dropdown.Section>
                        {options.map((option) => (
                            <Dropdown.Item
                                key={option.value}
                                id={option.value}
                                textValue={option.label}
                            >
                                <Dropdown.ItemIndicator />
                                <Label>{option.label}</Label>
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Section>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}
