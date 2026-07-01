"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    usePathname,
    useRouter,
} from "next/navigation"
import {
    getSettingsGroups,
} from "../nav"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"

/** localStorage key persisting the settings sidebar collapsed flag. */
const SIDEBAR_STORAGE_KEY = "starci.settings.sidebar.collapsed"

/** Props for {@link SettingsLayout}. */
export interface SettingsLayoutProps extends WithClassNames<undefined> {
    /** The active settings page rendered in the content column. */
    children: React.ReactNode
}

/**
 * Shared shell for the private account-settings pages (AI config, subscription,
 * usage, bookmarks, membership, edit profile, security, sessions). Two independent
 * scroll panes that fill the viewport below the sticky `h-16` navbar (no page
 * scroll): a grouped {@link CollapsibleSidebar} pinned to the LEFT edge with its
 * own scroll — it collapses in place to a thin rail (no Drawer), persisting the
 * choice — and the active page in the remaining space, centered in its own scroll
 * column. The open item is derived from the pathname. This is the "manage" world,
 * kept distinct from the public, GitHub-style profile (the "flex" world).
 *
 * @param props - {@link SettingsLayoutProps}
 */
export const SettingsLayout = ({
    children,
    className,
}: SettingsLayoutProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const groups = getSettingsGroups(locale)

    return (
        <div
            className={cn(
                // ONE scroll context (the page/body). No shell padding — the sidebar
                // sits flush so its border-r runs from under the navbar straight to
                // the bottom edge; the rail + content each own their p-6 breathing.
                "flex w-full flex-col md:flex-row md:items-start",
                className,
            )}
        >
            {/* sidebar — sticks under the 4rem navbar, viewport-tall on desktop; the
                block owns its own scroll (ScrollShadow), divider + width animation. */}
            <aside className="hidden shrink-0 md:block md:sticky md:top-16 md:h-[calc(100dvh-4rem)]">
                <CollapsibleSidebar
                    title={t("profileSettings.title")}
                    collapseLabel={t("profileSettings.collapseMenu")}
                    expandLabel={t("profileSettings.expandMenu")}
                    storageKey={SIDEBAR_STORAGE_KEY}
                >
                    {groups.map((group, index) => (
                        <SidebarNavGroup
                            key={group.key}
                            divider={index > 0}
                        >
                            {group.items.map((item) => (
                                <SidebarNavItem
                                    key={item.key}
                                    icon={item.icon}
                                    label={t(`profileSettings.items.${item.key}`)}
                                    isActive={pathname === item.href}
                                    onPress={() => router.push(item.href)}
                                />
                            ))}
                        </SidebarNavGroup>
                    ))}
                </CollapsibleSidebar>
            </aside>

            {/* content — the active settings page, flowing in the page scroll.
                Owns its own p-6 frame (the shell no longer pads). */}
            <main className="min-w-0 flex-1">
                {/* mobile fallback for the hidden sidebar: a horizontal scroll of the
                    settings nav (the desktop rail stacks full-height otherwise) */}
                <div className="sticky top-16 z-30 flex gap-2 overflow-x-auto border-b bg-background/80 px-4 py-2 backdrop-blur-xl md:hidden">
                    {groups.flatMap((group) => group.items).map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => router.push(item.href)}
                            className={cn(
                                "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                                pathname === item.href
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-default text-muted hover:bg-default",
                            )}
                        >
                            {item.icon}
                            <span className="whitespace-nowrap">
                                {t(`profileSettings.items.${item.key}`)}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="mx-auto max-w-3xl p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
