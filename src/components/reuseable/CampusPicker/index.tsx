"use client"

import React, { useMemo } from "react"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    cn,
} from "@heroui/react"
import { CaretDownIcon, MapPinIcon } from "@phosphor-icons/react"
import { useLocale } from "next-intl"
import type { CampusView } from "@/modules/api/rest/community"

/** Menu key for the "no campus" entry — kept distinct from any real campus code. */
const NONE_KEY = "__none"

/**
 * The campus name to SHOW for the active locale: `nameEn` on `en`, `name` everywhere else,
 * falling back to `name` whenever `nameEn` is null (the BE leaves it optional).
 *
 * Exported so every surface that has to word a campus OUTSIDE the picker — the campus feed's
 * empty state names the campus the reader picked — says exactly the same thing as the option
 * they picked it from. Two wordings for one campus in one screen is the bug this prevents.
 */
export const campusLabel = (campus: CampusView, locale: string): string =>
    locale === "en" ? campus.nameEn ?? campus.name : campus.name

/** Props for {@link CampusPicker}. */
export interface CampusPickerProps {
    /**
     * Active campuses (from `useQueryCampusesSwr`). Options are rendered in `sortOrder`
     * (the admin-curated order the BE already sorts by) and labelled per locale, so no
     * caller has to sort or translate the list itself.
     */
    campuses: Array<CampusView>
    /** Selected campus CODE, or `null` for no campus. */
    value: string | null
    /** Fires with the picked campus code (`null` when the "no campus" entry is picked). */
    onChange: (code: string | null) => void
    /** Label of the placeholder / "no campus" entry (also shown on the trigger when unset). */
    placeholder: string
    /** Accessible name for the menu (the trigger is icon + text, so a11y needs this). */
    ariaLabel: string
    /** Disables the trigger. */
    isDisabled?: boolean
    /** Extra classes on the trigger. */
    className?: string
}

/**
 * Single-select campus dropdown built on HeroUI `Dropdown`
 * pattern (the repo carries no HeroUI `Select`): a bordered trigger showing the
 * selected campus name — or the {@link placeholder} when unset — over a menu whose
 * first entry resets the choice to the {@link placeholder} meaning. Options render each
 * campus name but the selected VALUE is the campus `code`, which is what the BE stores.
 *
 * The list is ordered by `sortOrder` and each option is labelled with {@link campusLabel}
 * HERE rather than at the call sites, so the composer, profile edit and the campus-feed
 * filter all show the same campus with the same order and the same wording.
 */
export const CampusPicker = ({
    campuses,
    value,
    onChange,
    placeholder,
    ariaLabel,
    isDisabled,
    className,
}: CampusPickerProps) => {
    const locale = useLocale()
    // Copy before sorting: the array comes from a shared SWR cache entry, and `sort` mutates.
    const options = useMemo(
        () => [...campuses].sort((a, b) => a.sortOrder - b.sortOrder),
        [campuses],
    )
    const active = options.find((campus) => campus.code === value)
    const activeLabel = active ? campusLabel(active, locale) : placeholder

    return (
        <Dropdown>
            <DropdownTrigger
                isDisabled={isDisabled || campuses.length === 0}
                className={cn(
                    "cursor-pointer rounded-2xl border border-default px-3 py-2",
                    className,
                )}
            >
                <div className="flex items-center gap-2">
                    <MapPinIcon aria-hidden focusable="false" className="size-4 text-accent" />
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
                    {options.map((campus) => (
                        <DropdownItem
                            key={campus.code}
                            id={campus.code}
                            textValue={campusLabel(campus, locale)}
                        >
                            {campusLabel(campus, locale)}
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </DropdownPopover>
        </Dropdown>
    )
}
