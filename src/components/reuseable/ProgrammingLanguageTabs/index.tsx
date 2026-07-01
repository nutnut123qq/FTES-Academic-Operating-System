"use client"

import React, {
    useCallback,
    useMemo,
} from "react"
import {
    Tabs,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    PROGRAMMING_LANGUAGE_TABS_INDICATOR_CLASS_NAME,
    PROGRAMMING_LANGUAGE_TABS_LIST_CLASS_NAME,
    PROGRAMMING_LANGUAGE_TABS_ROOT_CLASS_NAME,
    PROGRAMMING_LANGUAGE_TABS_SECONDARY_LIST_CLASS_NAME,
    PROGRAMMING_LANGUAGE_TABS_SECONDARY_ROOT_CLASS_NAME,
    PROGRAMMING_LANGUAGE_TABS_SECONDARY_TAB_CLASS_NAME,
} from "./constants"
import {
    ProgrammingLanguageTabsVariant,
} from "./enums"
import {
    programmingLanguageIconMap,
} from "./map"
import { DEFAULT_PROGRAMMING_LANGUAGES, isProgrammingLangAvailable, resolveActiveProgrammingLang } from "@/modules/types/utils/programming-language"

/**
 * Props for {@link ProgrammingLanguageTabs}.
 */
export interface ProgrammingLanguageTabsProps extends WithClassNames<undefined> {
    /** Language keys returned by the backend (subset of the default four). */
    availableLangs: Array<string>
    /** Controlled selected language key (normalized by {@link resolveActiveProgrammingLang}). */
    selectedLang: string
    /** Fired when the user selects an enabled tab. */
    onSelectLang: (lang: string) => void
    /** Accessible name for the tab list. */
    ariaLabel: string
    /** Optional wrapper class on the root `Tabs`. */
    className?: string
    /** When true, always render four tabs even if `availableLangs` is empty (all disabled). */
    alwaysShow?: boolean
    /**
     * Tab chrome: compact pills ({@link ProgrammingLanguageTabsVariant.Pill}) or
     * full-width underline tabs like {@link ContentTabBar} ({@link ProgrammingLanguageTabsVariant.Secondary}).
     */
    variant?: ProgrammingLanguageTabsVariant
    /**
     * When false with {@link ProgrammingLanguageTabsVariant.Secondary}, skip the full-width
     * `border-b` wrapper so the parent can own edge-to-edge dividers around padded tab content.
     */
    surfaceBorder?: boolean
}

/**
 * Fixed four-tab programming-language switcher (TypeScript, Java, C#, Go).
 *
 * Supports pill (default) or secondary underline layout via {@link ProgrammingLanguageTabsProps.variant}.
 * Tabs missing from `availableLangs` are rendered disabled. Presentational only.
 * @param props - available langs, selection, callbacks and optional variant
 */
export const ProgrammingLanguageTabs = ({
    availableLangs,
    selectedLang,
    onSelectLang,
    ariaLabel,
    className,
    alwaysShow = false,
    variant = ProgrammingLanguageTabsVariant.Pill,
    surfaceBorder = true,
}: ProgrammingLanguageTabsProps) => {
    const t = useTranslations()
    const isSecondary = variant === ProgrammingLanguageTabsVariant.Secondary

    const tabItems = useMemo(
        () => DEFAULT_PROGRAMMING_LANGUAGES.map((lang) => ({
            lang,
            isDisabled: !isProgrammingLangAvailable(lang, availableLangs),
        })),
        [availableLangs],
    )

    const activeKey = useMemo(
        () => resolveActiveProgrammingLang(selectedLang, availableLangs),
        [selectedLang, availableLangs],
    )

    const onSelectionChange = useCallback(
        (key: React.Key) => onSelectLang(String(key)),
        [onSelectLang],
    )

    if (!alwaysShow && availableLangs.length === 0) {
        return null
    }

    const tabs = (
        <Tabs
            className={cn(
                isSecondary
                    ? PROGRAMMING_LANGUAGE_TABS_SECONDARY_ROOT_CLASS_NAME
                    : PROGRAMMING_LANGUAGE_TABS_ROOT_CLASS_NAME,
                className,
            )}
            selectedKey={activeKey}
            variant={isSecondary ? "secondary" : undefined}
            onSelectionChange={onSelectionChange}
        >
            <Tabs.ListContainer className={isSecondary ? "w-full" : undefined}>
                <Tabs.List
                    aria-label={ariaLabel}
                    className={isSecondary
                        ? PROGRAMMING_LANGUAGE_TABS_SECONDARY_LIST_CLASS_NAME
                        : PROGRAMMING_LANGUAGE_TABS_LIST_CLASS_NAME}
                >
                    {tabItems.map(({ lang, isDisabled }) => {
                        const Icon = programmingLanguageIconMap[lang]
                        return (
                            <Tabs.Tab
                                key={lang}
                                id={lang}
                                isDisabled={isDisabled}
                                className={isSecondary
                                    ? PROGRAMMING_LANGUAGE_TABS_SECONDARY_TAB_CLASS_NAME
                                    : undefined}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Icon
                                        aria-hidden
                                        className={cn("shrink-0", isSecondary ? "size-5" : "size-5")}
                                    />
                                    {t(`programmingLanguage.${lang}`)}
                                </span>
                                {isSecondary ? null : (
                                    <Tabs.Indicator
                                        className={PROGRAMMING_LANGUAGE_TABS_INDICATOR_CLASS_NAME}
                                    />
                                )}
                            </Tabs.Tab>
                        )
                    })}
                </Tabs.List>
            </Tabs.ListContainer>
        </Tabs>
    )

    if (isSecondary && surfaceBorder) {
        return (
            <div className="w-full border-b">
                {tabs}
            </div>
        )
    }

    return tabs
}

export {
    ProgrammingLanguageTabsVariant,
} from "./enums"
export {
    programmingLanguageIconMap,
} from "./map"
