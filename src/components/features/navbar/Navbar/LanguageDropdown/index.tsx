"use client"

import React from "react"
import { TranslateIcon } from "@phosphor-icons/react"
import type { Selection } from "@heroui/react"
import {
    Button,
    Dropdown,
    Label,
} from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { languages } from "@/resources/constants/lang"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link LanguageDropdown}.
 */
export type LanguageDropdownProps = WithClassNames<undefined>

/**
 * Standalone language switcher for the navbar — a globe-icon dropdown listing the
 * available locales with a single-selection check (Dropdown.ItemIndicator) on the
 * active one. Pulled OUT of the account menu so switching language is a
 * first-class, one-tap action. Self-contained: reads the active locale and
 * self-navigates to the same path under the chosen locale via the i18n router.
 *
 * @param props - optional root class name (placement only)
 */
export const LanguageDropdown = ({ className }: LanguageDropdownProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    /** Switch to the picked locale (same path) when the selection changes. */
    const onSelectionChange = (keys: Selection) => {
        if (keys === "all") return
        const next = [...keys][0]
        if (next && String(next) !== locale) {
            router.replace(pathname, { locale: String(next) })
        }
    }

    return (
        <Dropdown>
            <Button
                isIconOnly
                variant="tertiary"
                aria-label={t("nav.toggleLanguage")}
                className={className}
            >
                <TranslateIcon className="size-5" />
            </Button>
            <Dropdown.Popover>
                <Dropdown.Menu
                    selectionMode="single"
                    selectedKeys={new Set([locale])}
                    onSelectionChange={onSelectionChange}
                >
                    <Dropdown.Section>
                        {languages.map((language) => (
                            <Dropdown.Item
                                key={language.code}
                                id={language.code}
                                textValue={language.label}
                            >
                                <Dropdown.ItemIndicator />
                                <Label>{language.label}</Label>
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Section>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}
