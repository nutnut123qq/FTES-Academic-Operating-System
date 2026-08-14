"use client"

import React from "react"
import { useRouter, useSelectedLayoutSegments } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { BellIcon, DevicesIcon, PaletteIcon, ShieldCheckIcon } from "@phosphor-icons/react"
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
    /** Child segment under `settings` — `""` for the hub (appearance). */
    segment: string
    /** Builds the absolute route for a locale. */
    href: (locale: string) => string
}

/** The four settings sections, in rail order: Appearance, Security, Manage Devices, Notifications. */
const NAV_ITEMS: Array<SettingsNavItem> = [
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
        key: "notifications",
        icon: <BellIcon className="size-5" aria-hidden focusable="false" />,
        segment: "notifications",
        href: (locale) => pathConfig().locale(locale).profile().notifications().build(),
    },
]

/**
 * The `/profile/settings/*` shell: a left navigation rail listing the settings
 * sections (appearance · notifications · security) beside the active section.
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
                    <SidebarNavGroup label={t("profileSettings.groups.account")}>
                        {NAV_ITEMS.map((item) => (
                            <SidebarNavItem
                                key={item.key}
                                icon={item.icon}
                                label={t(`profileSettings.items.${item.key}`)}
                                isActive={activeSegment === item.segment}
                                onPress={() => router.push(item.href(locale))}
                            />
                        ))}
                    </SidebarNavGroup>
                </CollapsibleSidebar>
            </div>

            <div className="min-w-0 flex-1 p-6">
                <div className="mx-auto w-full max-w-3xl">{children}</div>
            </div>
        </div>
    )
}
