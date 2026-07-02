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
import { useTranslations } from "next-intl"
import { CaretDownIcon } from "@phosphor-icons/react"
import {
    CONFIG_CATEGORIES,
    CONFIG_CATEGORY_LABEL_KEY,
} from "@/resources/constants/config"
import type { ConfigCategory } from "@/resources/constants/config"

/** Props for {@link ConfigCategoryNav}. */
export interface ConfigCategoryNavProps {
    /** The category currently shown in the panel. */
    active: ConfigCategory
    /** Fired with the target category — the shell owns routing (and the dirty-guard). */
    onNavigate: (category: ConfigCategory) => void
}

/**
 * ConfigCategoryNav — the 7-category navigation of the Config Center. Desktop
 * (`lg:`) renders a vertical rail; mobile collapses into a dropdown showing the
 * active category. A `<nav>` landmark labelled from i18n; the active item is
 * marked `aria-current="page"`. Navigation is delegated upward so the shell can
 * intercept it with the unsaved-changes guard.
 */
export const ConfigCategoryNav = ({ active, onNavigate }: ConfigCategoryNavProps) => {
    const t = useTranslations()

    return (
        <nav aria-label={t("admin.config.nav.label")} className="lg:sticky lg:top-6 lg:self-start">
            {/* mobile: collapsed dropdown */}
            <div className="lg:hidden">
                <Dropdown>
                    <DropdownTrigger className="w-full cursor-pointer rounded-large border border-separator px-4 py-3">
                        <div className="flex w-full items-center justify-between gap-2 text-sm font-medium">
                            {t(CONFIG_CATEGORY_LABEL_KEY[active])}
                            <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                        </div>
                    </DropdownTrigger>
                    <DropdownPopover className="min-w-56">
                        <DropdownMenu aria-label={t("admin.config.nav.label")}>
                            {CONFIG_CATEGORIES.map((category) => (
                                <DropdownItem
                                    key={category}
                                    textValue={t(CONFIG_CATEGORY_LABEL_KEY[category])}
                                    onPress={() => onNavigate(category)}
                                >
                                    <span className={cn(category === active && "text-accent")}>
                                        {t(CONFIG_CATEGORY_LABEL_KEY[category])}
                                    </span>
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </DropdownPopover>
                </Dropdown>
            </div>

            {/* desktop: vertical rail */}
            <ul className="hidden flex-col gap-2 lg:flex">
                {CONFIG_CATEGORIES.map((category) => {
                    const isActive = category === active
                    return (
                        <li key={category}>
                            <button
                                type="button"
                                aria-current={isActive ? "page" : undefined}
                                onClick={() => onNavigate(category)}
                                className={cn(
                                    "w-full rounded-large px-4 py-2 text-left text-sm transition-colors",
                                    isActive
                                        ? "bg-accent/10 font-medium text-accent"
                                        : "text-foreground hover:bg-default",
                                )}
                            >
                                {t(CONFIG_CATEGORY_LABEL_KEY[category])}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
