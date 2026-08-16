"use client"

import React from "react"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    cn,
} from "@heroui/react"
import { CaretDownIcon, GraduationCapIcon } from "@phosphor-icons/react"
import type { Major } from "@/components/features/subject/hooks/useQueryMajorsSwr"

/** Menu key for the "no major" entry — kept distinct from any real major code. */
const NONE_KEY = "__none"

/** Props for {@link MajorPicker}. */
export interface MajorPickerProps {
    /** Selectable majors (from `useQueryMajorsSwr`) — options show each `name`. */
    majors: Array<Major>
    /** Selected major CODE, or `null` for "not chosen". */
    value: string | null
    /** Fires with the picked major code (`null` when the "no major" entry is picked). */
    onChange: (code: string | null) => void
    /** Label of the placeholder / "no major" entry (also shown on the trigger when unset). */
    placeholder: string
    /** Accessible name for the menu (the trigger is icon + text, so a11y needs this). */
    ariaLabel: string
    /** Disables the trigger. */
    isDisabled?: boolean
    /** Extra classes on the trigger. */
    className?: string
}

/**
 * Single-select major dropdown — the sibling of `CampusPicker`, same HeroUI `Dropdown`
 * pattern (the repo carries no HeroUI `Select`). Options render each major's localised
 * `name` but the selected VALUE is the `code`, which is what the BE stores in
 * `profile.profiles.major_code`.
 *
 * The trigger disables itself on an EMPTY catalogue: `useQueryMajorsSwr` documents that
 * an empty list is a legitimate state (backend without the majors endpoint, or a
 * catalogue nobody has filled in), and a dropdown that opens onto nothing reads as
 * broken.
 */
export const MajorPicker = ({
    majors,
    value,
    onChange,
    placeholder,
    ariaLabel,
    isDisabled,
    className,
}: MajorPickerProps) => {
    const activeLabel = majors.find((major) => major.code === value)?.name ?? placeholder

    return (
        <Dropdown>
            <DropdownTrigger
                isDisabled={isDisabled || majors.length === 0}
                className={cn(
                    "cursor-pointer rounded-2xl border border-default px-3 py-2",
                    className,
                )}
            >
                <div className="flex items-center gap-2">
                    <GraduationCapIcon aria-hidden focusable="false" className="size-4 text-accent" />
                    <span className="max-w-56 truncate text-sm font-medium">{activeLabel}</span>
                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                </div>
            </DropdownTrigger>
            <DropdownPopover className="min-w-56">
                <DropdownMenu
                    aria-label={ariaLabel}
                    onAction={(key) => onChange(key === NONE_KEY ? null : String(key))}
                >
                    <DropdownItem key={NONE_KEY} id={NONE_KEY} textValue={placeholder}>
                        {placeholder}
                    </DropdownItem>
                    {majors.map((major) => (
                        <DropdownItem key={major.code} id={major.code} textValue={major.name}>
                            {major.name}
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </DropdownPopover>
        </Dropdown>
    )
}
