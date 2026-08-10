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
import { CaretDownIcon, MapPinIcon } from "@phosphor-icons/react"
import type { CampusView } from "@/modules/api/rest/community"

/** Menu key for the "no campus" entry — kept distinct from any real campus code. */
const NONE_KEY = "__none"

/** Props for {@link CampusPicker}. */
export interface CampusPickerProps {
    /** Active campuses (from `useQueryCampusesSwr`) — options show each `name`. */
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
 * Single-select campus dropdown. Mirrors {@link AiModelPicker}'s HeroUI `Dropdown`
 * pattern (the repo carries no HeroUI `Select`): a bordered trigger showing the
 * selected campus `name` — or the {@link placeholder} when unset — over a menu whose
 * first entry clears the choice back to "no campus". Options render each campus `name`
 * but the selected VALUE is the campus `code`, which is what the BE stores.
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
    const activeLabel = campuses.find((campus) => campus.code === value)?.name ?? placeholder

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
                    {campuses.map((campus) => (
                        <DropdownItem key={campus.code} id={campus.code} textValue={campus.name}>
                            {campus.name}
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </DropdownPopover>
        </Dropdown>
    )
}
