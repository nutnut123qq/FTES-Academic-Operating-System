"use client"

import {
    BookOpenIcon,
    ListIcon,
    ListBulletsIcon,
} from "@phosphor-icons/react"
import React, { useEffect } from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ContentMap } from "@/components/features/learn/ContentMap"
import { OnThisPage } from "@/components/features/learn/OnThisPage"
import { useTableOfContents } from "@/components/features/learn/OnThisPage/hooks/useTableOfContents"
import { useSidebarNavItems } from "../hooks/useSidebarNavItems"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setMobileView, type MobileLearnView } from "@/redux/slices/sidebar"

/**
 * Mobile bottom-tab bar for the lesson reader (hidden from `lg` up).
 *
 * The desktop 4-column layout (course-nav · content-map · content · on-this-page)
 * has no room on phones, so this collapses it into an app-style bottom-tab: one
 * full-screen view at a time, thumb-reachable. Three tabs —
 *  - **Mục lục**: course-nav rows ({@link SidebarNavItem}) + the {@link ContentMap}
 *    lesson list (both are "navigation");
 *  - **Bài học**: the content itself (the reader is rendered by the shell — this
 *    tab just closes the overlays);
 *  - **Trên trang**: the {@link OnThisPage} outline (self-hides → tab omitted when
 *    the lesson has no headings).
 *
 * Selecting a new lesson lands the reader back on the content view. State lives in
 * the `sidebar` slice (`mobileView`) so the shell can mount the matching view.
 */
export const LearnMobileTabBar = () => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const view = useAppSelector((state) => state.sidebar.mobileView)
    const contentId = useAppSelector((state) => state.content.id)
    const { items, selectedTab, onSelect } = useSidebarNavItems()
    // mirror OnThisPage's self-hide: no headings → no "on this page" tab
    const { headings } = useTableOfContents(contentId)
    const hasToc = headings.length > 0

    // opening a new lesson (from the map) lands the reader back on the content
    useEffect(() => {
        dispatch(setMobileView("content"))
    }, [contentId, dispatch])

    // never strand the user on a "Trên trang" tab that just vanished
    useEffect(() => {
        if (view === "toc" && !hasToc) {
            dispatch(setMobileView("content"))
        }
    }, [view, hasToc, dispatch])

    const tabs: Array<{ key: MobileLearnView; icon: typeof ListIcon; label: string }> = [
        { key: "map", icon: ListIcon, label: t("learnTabs.contents") },
        { key: "content", icon: BookOpenIcon, label: t("learnTabs.lesson") },
        ...(hasToc
            ? [{ key: "toc" as const, icon: ListBulletsIcon, label: t("learnTabs.onThisPage") }]
            : []),
    ]

    return (
        <>
            {/* full-screen "Mục lục" overlay — course-nav + the lesson list */}
            {view === "map" && (
                <div className="fixed inset-x-0 top-16 bottom-16 z-30 overflow-y-auto bg-background lg:hidden">
                    <div className="flex flex-col gap-3 p-6">
                        {items.map((item) => (
                            <SidebarNavItem
                                key={item.value}
                                icon={<item.icon className="size-5 shrink-0" />}
                                label={item.label}
                                isActive={selectedTab === item.tab}
                                onPress={() => onSelect(item)}
                            />
                        ))}
                    </div>
                    <div className="border-t" />
                    <ContentMap />
                </div>
            )}

            {/* full-screen "Trên trang" overlay — the lesson outline + actions */}
            {view === "toc" && hasToc && (
                <div className="fixed inset-x-0 top-16 bottom-16 z-30 overflow-y-auto bg-background lg:hidden">
                    <OnThisPage mobile />
                </div>
            )}

            {/* the bottom-tab bar itself */}
            <nav
                role="tablist"
                aria-label={t("learnTabs.contents")}
                className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t bg-background/90 backdrop-blur-xl lg:hidden"
            >
                {tabs.map((tab) => {
                    const isActive = view === tab.key
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => dispatch(setMobileView(tab.key))}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-2",
                                isActive ? "text-accent" : "text-muted",
                            )}
                        >
                            <tab.icon className="size-5" weight={isActive ? "fill" : "regular"} />
                            <span className="text-xs">{tab.label}</span>
                        </button>
                    )
                })}
            </nav>
        </>
    )
}

export default LearnMobileTabBar
