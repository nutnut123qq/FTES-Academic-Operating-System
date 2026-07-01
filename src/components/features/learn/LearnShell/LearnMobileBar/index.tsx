"use client"

import {
    ListBulletsIcon,
    ListIcon,
} from "@phosphor-icons/react"
import React, { useEffect, useState } from "react"
import { Button, cn, Drawer, ScrollShadow } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSelectedLayoutSegments } from "next/navigation"
import { ContentMap } from "@/components/features/learn/ContentMap"
import {
    useSidebarNavItems,
} from "../hooks/useSidebarNavItems"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"

/** Props for {@link LearnMobileBar}. */
export type LearnMobileBarProps = WithClassNames<undefined>

/**
 * Mobile toolbar for the course-learn pages (hidden from `lg` up).
 *
 * Container: surfaces the two sidebars that are hidden on small screens as
 * slide-in drawers — the course nav (left) and the module outline (right). The
 * nav rows reuse the {@link SidebarNavItem} block (always expanded here) and
 * self-route via the shared select handler. Each drawer is controlled by local
 * open state. `"use client"` for the interactive triggers + shared nav hook.
 * @param props - {@link LearnMobileBarProps}
 */
export const LearnMobileBar = ({ className }: LearnMobileBarProps) => {
    const t = useTranslations()
    // shared course-nav entries (same list the desktop sidebar renders)
    const { items, selectedTab, onSelect } = useSidebarNavItems()
    // the module-outline (ContentMap) drawer only makes sense on the content reader
    // routes; on other surfaces (flashcards / leaderboard / foundations…) it would
    // open the wrong tree, so the outline trigger + drawer are hidden there.
    const segments = useSelectedLayoutSegments()
    const isContentRoute = segments.includes("modules") || segments[0] === "content"
    // open state for the left (course menu) drawer
    const [isMenuOpen, setMenuOpen] = useState(false)
    // open state for the right (module outline) drawer
    const [isOutlineOpen, setOutlineOpen] = useState(false)

    // rows self-dispatch their tab + navigation; collapse the drawer whenever the
    // active tab changes so the user lands back on the content
    useEffect(() => {
        setMenuOpen(false)
    }, [selectedTab])

    return (
        // sticky bar sitting directly under the 64px navbar; mobile/tablet only
        <div className={cn("sticky top-16 z-40 flex items-center gap-3 border-b bg-background/80 px-3 py-2 backdrop-blur-xl lg:hidden", className)}>
            {/* trigger: open the course navigation drawer */}
            <Button variant="ghost" size="sm" onPress={() => setMenuOpen(true)}>
                <ListIcon className="size-5" />
                {t("nav.courseMenu")}
            </Button>
            {/* trigger: open the module outline drawer — content reader routes only */}
            {isContentRoute ? (
                <Button variant="ghost" size="sm" onPress={() => setOutlineOpen(true)}>
                    <ListBulletsIcon className="size-5" />
                    {t("nav.contentOutline")}
                </Button>
            ) : null}

            {/* left drawer — course-learn navigation list */}
            <Drawer>
                <Drawer.Backdrop isOpen={isMenuOpen} onOpenChange={setMenuOpen}>
                    <Drawer.Content placement="left">
                        <Drawer.Dialog className="p-0">
                            <div className="p-3">
                                <Drawer.CloseTrigger />
                                <Drawer.Header>
                                    <Drawer.Heading>{t("nav.courseMenu")}</Drawer.Heading>
                                </Drawer.Header>
                            </div>
                            <div className="border-b" />
                            <Drawer.Body className="p-3">
                                <div className="flex flex-col gap-3">
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
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </Drawer>

            {/* right drawer — module + content outline (content reader routes only) */}
            {isContentRoute ? (
                <Drawer>
                    <Drawer.Backdrop isOpen={isOutlineOpen} onOpenChange={setOutlineOpen}>
                        <Drawer.Content placement="right">
                            <Drawer.Dialog className="p-0">
                                <div className="p-3">
                                    <Drawer.CloseTrigger />
                                    <Drawer.Header>
                                        <Drawer.Heading>{t("nav.contentOutline")}</Drawer.Heading>
                                    </Drawer.Header>
                                </div>
                                <div className="border-b" />
                                <Drawer.Body className="p-0">
                                    <ScrollShadow hideScrollBar className="h-full overflow-y-auto">
                                        <ContentMap />
                                    </ScrollShadow>
                                </Drawer.Body>
                            </Drawer.Dialog>
                        </Drawer.Content>
                    </Drawer.Backdrop>
                </Drawer>
            ) : null}
        </div>
    )
}
