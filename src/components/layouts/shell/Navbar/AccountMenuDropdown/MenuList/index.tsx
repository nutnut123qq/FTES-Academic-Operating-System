"use client"

import { Bookmark as BookmarkSimpleIcon, ChevronRight as CaretRightIcon } from "@gravity-ui/icons"
import { FaGithub } from "react-icons/fa6"
import React, { useCallback, useMemo } from "react"
import {
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import { useRouter } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"
import { languages } from "@/resources/constants/lang"
import { useAccountMenuOverlayState, useLanguageOverlayState, useLinkGithubOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link MenuList}.
 */
export type MenuListProps = WithClassNames<undefined>

/**
 * Dropdown body menu: an authenticated-only bookmarks section plus the
 * language switcher row.
 *
 * Container: reads auth state from Redux, derives current language from locale,
 * and self-dispatches navigation + overlay actions on press.
 * `"use client"` for hooks + press handlers.
 * @param props - optional root class name
 */
export const MenuList = ({ className }: MenuListProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const user = useAppSelector((state) => state.user.user)
    const { close } = useAccountMenuOverlayState()
    const { open: openLanguage } = useLanguageOverlayState()
    const { setOpen: setLinkGithubOpen } = useLinkGithubOverlayState()

    /** Language entry matching the active locale (for the label). */
    const currentLanguageLabel = useMemo(
        () => languages.find((lang) => lang.code === locale)?.label,
        [locale],
    )

    /** Close the dropdown and navigate to the bookmarks page. */
    const onOpenBookmarks = useCallback(
        () => {
            close()
            router.push(pathConfig().locale().profile().bookmarks().build())
        },
        [close, router],
    )

    /** Close the dropdown and open the language overlay. */
    const onOpenLanguage = useCallback(
        () => {
            close()
            openLanguage()
        },
        [close, openLanguage],
    )

    /** Close the dropdown and open the link-GitHub modal (manual entry point). */
    const onLinkGithub = useCallback(
        () => {
            close()
            setLinkGithubOpen(true)
        },
        [close, setLinkGithubOpen],
    )

    return (
        <DropdownMenu className={cn(className)}>
            {/** Settings block */}
            {!!user && (
                <DropdownSection className="border-b border-divider pb-2 mb-2">
                    {/* manual GitHub-link entry point — self-hides once the account is linked
                        (githubUsername set after the modal succeeds + the `me` query refreshes) */}
                    {!user.githubUsername ? (
                        <DropdownItem
                            key="link-github"
                            onPress={onLinkGithub}
                            className="py-3"
                        >
                            <div className="flex items-center gap-3 w-full">
                                <FaGithub className="size-5" />
                                <div className="text-sm">{t("linkGithub.title")}</div>
                            </div>
                        </DropdownItem>
                    ) : null}
                    <DropdownItem
                        key="bookmarks"
                        onPress={onOpenBookmarks}
                        className="py-3"
                    >
                        <div className="flex items-center gap-3 w-full">
                            <BookmarkSimpleIcon className="size-5" />
                            <div className="text-sm">{t("content.saved")}</div>
                        </div>
                    </DropdownItem>
                </DropdownSection>
            )}
            <DropdownSection>
                <DropdownItem
                    key="language"
                    onPress={onOpenLanguage}
                    className="py-3"
                >
                    <div className="flex items-center justify-between gap-3 w-full">
                        <div className="text-sm">{t("nav.toggleLanguage")}</div>
                        <div className="flex items-center gap-1.5 text-sm text-muted">
                            {currentLanguageLabel}
                            <CaretRightIcon className="size-5" />
                        </div>
                    </div>
                </DropdownItem>
            </DropdownSection>
        </DropdownMenu>
    )
}
