"use client"

import React from "react"
import { useRouter, useSelectedLayoutSegments } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@heroui/react"
import {
    ArrowLeftIcon,
    BellIcon,
    ClockCounterClockwiseIcon,
    CrownIcon,
    DevicesIcon,
    EyeSlashIcon,
    PaletteIcon,
    PencilSimpleIcon,
    RobotIcon,
    SealCheckIcon,
    ShieldCheckIcon,
} from "@phosphor-icons/react"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"
import { pathConfig } from "@/resources/path"

/** Props for {@link SettingsShell}. */
interface SettingsShellProps {
    /** The active settings section page. */
    children: React.ReactNode
}

/**
 * One rail row: the i18n label key, its icon, the route segment under
 * `/profile/settings` (empty = the hub itself), and how to build its URL.
 */
interface SettingsNavItem {
    /** Stable key + `profileSettings.items.<key>` label. */
    key: string
    /** Leading icon. */
    icon: React.ReactNode
    /**
     * Child segment under `settings` — `""` for the hub (appearance), `null` for a
     * destination that lives OUTSIDE the settings subtree (never marked active
     * here, since navigating there leaves this shell).
     */
    segment: string | null
    /** Builds the absolute route for a locale. */
    href: (locale: string) => string
}

/** A labelled cluster of rail rows. */
interface SettingsNavGroup {
    /** Stable key + `profileSettings.groups.<key>` caption. */
    key: string
    /** The rows in this group. */
    items: Array<SettingsNavItem>
}

/**
 * The settings destinations, grouped the way the rail renders them: "Account"
 * (profile editor, appearance, security, devices, membership), "Learning" (course
 * history), "FrosTES" (AI settings, AI plan) then "Preferences" (privacy,
 * notifications). Only destinations that already exist are listed — the rail is
 * navigation, not a menu of intentions.
 */
const NAV_GROUPS: Array<SettingsNavGroup> = [
    {
        key: "account",
        items: [
            {
                key: "editProfile",
                icon: <PencilSimpleIcon className="size-5" aria-hidden focusable="false" />,
                // `/profile/edit` is a profile page with its own shell, not a settings section
                segment: null,
                href: (locale) => pathConfig().locale(locale).profile().edit().build(),
            },
            {
                key: "appearance",
                icon: <PaletteIcon className="size-5" aria-hidden focusable="false" />,
                segment: "",
                href: (locale) => pathConfig().locale(locale).profile().settings().build(),
            },
            {
                key: "security",
                icon: <ShieldCheckIcon className="size-5" aria-hidden focusable="false" />,
                segment: "security",
                href: (locale) => pathConfig().locale(locale).profile().security().build(),
            },
            {
                key: "sessions",
                icon: <DevicesIcon className="size-5" aria-hidden focusable="false" />,
                segment: "sessions",
                href: (locale) => pathConfig().locale(locale).profile().sessions().build(),
            },
            {
                key: "membership",
                icon: <SealCheckIcon className="size-5" aria-hidden focusable="false" />,
                segment: "membership",
                href: (locale) => pathConfig().locale(locale).profile().membership().build(),
            },
        ],
    },
    {
        key: "learning",
        items: [
            {
                key: "courseHistory",
                icon: <ClockCounterClockwiseIcon className="size-5" aria-hidden focusable="false" />,
                segment: "learning",
                href: (locale) => pathConfig().locale(locale).profile().learning().build(),
            },
        ],
    },
    {
        key: "ai",
        items: [
            {
                key: "aiSettings",
                icon: <RobotIcon className="size-5" aria-hidden focusable="false" />,
                segment: "ai-settings",
                href: (locale) => pathConfig().locale(locale).profile().aiSettings().build(),
            },
            {
                key: "aiSubscription",
                icon: <CrownIcon className="size-5" aria-hidden focusable="false" />,
                segment: "ai-subscription",
                href: (locale) => pathConfig().locale(locale).profile().aiSubscription().build(),
            },
        ],
    },
    {
        key: "preferences",
        items: [
            {
                key: "privacy",
                icon: <EyeSlashIcon className="size-5" aria-hidden focusable="false" />,
                segment: "privacy",
                href: (locale) => pathConfig().locale(locale).profile().privacy().build(),
            },
            {
                key: "notifications",
                icon: <BellIcon className="size-5" aria-hidden focusable="false" />,
                segment: "notifications",
                href: (locale) => pathConfig().locale(locale).profile().notifications().build(),
            },
        ],
    },
]

/**
 * The `/profile/settings/*` shell: a left navigation rail listing the settings
 * destinations in labelled groups (Account: profile editor · appearance · security ·
 * devices — Preferences: privacy · notifications) beside the active section, with a
 * Back control above the section content.
 *
 * Mirrors `SubjectWorkspaceShell` — the same {@link CollapsibleSidebar} rail, the same
 * sticky one-scroll layout (the BODY scrolls; the rail sticks under the 4rem navbar,
 * never a second nested scroll container) and the same "only the active row is filled"
 * rule the rail block already enforces.
 *
 * Active detection reads `useSelectedLayoutSegments()` (segments below the profile
 * layout: `["settings", <section>]`) rather than `usePathname()`, so it never has to
 * parse or guess at a locale prefix.
 *
 * @param props - {@link SettingsShellProps}
 */
export const SettingsShell = ({ children }: SettingsShellProps) => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()
    // ["settings"] on the hub, ["settings", "security"] on a section
    const segments = useSelectedLayoutSegments()
    const activeSegment = segments[1] ?? ""

    /**
     * Leave settings: step back through history when there is somewhere to go
     * back to, otherwise land on the profile (a cold entry — deep link, refresh —
     * has no previous page and `router.back()` would do nothing).
     */
    const onBack = () => {
        if (window.history.length > 1) {
            router.back()
            return
        }
        router.push(pathConfig().locale(locale).profile().build())
    }

    return (
        <div className="flex w-full flex-1">
            <div className="shrink-0 md:sticky md:top-16 md:h-[calc(100dvh-4rem)]">
                <CollapsibleSidebar
                    title={t("profileSettings.title")}
                    collapseLabel={t("profileSettings.collapseMenu")}
                    expandLabel={t("profileSettings.expandMenu")}
                    storageKey="profile-settings-sidebar-collapsed"
                    className="h-full"
                >
                    {NAV_GROUPS.map((group, index) => (
                        <SidebarNavGroup
                            key={group.key}
                            label={t(`profileSettings.groups.${group.key}`)}
                            divider={index > 0}
                        >
                            {group.items.map((item) => (
                                <SidebarNavItem
                                    key={item.key}
                                    icon={item.icon}
                                    label={t(`profileSettings.items.${item.key}`)}
                                    isActive={item.segment !== null && activeSegment === item.segment}
                                    onPress={() => router.push(item.href(locale))}
                                />
                            ))}
                        </SidebarNavGroup>
                    ))}
                </CollapsibleSidebar>
            </div>

            <div className="min-w-0 flex-1 p-6">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                    {/* way out of the settings world — back to wherever the user came
                        from, falling back to their profile on a cold entry */}
                    <div>
                        <Button
                            variant="tertiary"
                            size="sm"
                            onPress={onBack}
                        >
                            <ArrowLeftIcon className="size-4" aria-hidden focusable="false" />
                            {t("common.back")}
                        </Button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
