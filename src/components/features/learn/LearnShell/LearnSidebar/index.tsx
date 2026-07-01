"use client"

import React from "react"
import {
    useTranslations,
} from "next-intl"
import {
    LockSimpleIcon,
} from "@phosphor-icons/react"
import {
    useSidebarNavItems,
} from "../hooks/useSidebarNavItems"
import type {
    LearnNavGroup,
} from "../types"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"

/** localStorage key persisting the learn course-nav collapsed flag. */
const SIDEBAR_STORAGE_KEY = "starci.learn.sidebar.collapsed"

/**
 * Order the separator-divided nav clusters render in: course content, then the
 * hands-on work + leaderboard. The first group has no divider; every later group
 * gets a full-width {@link SidebarNavGroup} divider on top.
 */
const GROUP_ORDER: ReadonlyArray<LearnNavGroup> = ["study", "practice"]

/** Props for {@link LearnSidebar}. */
export type LearnSidebarProps = WithClassNames<undefined>

/**
 * Course-learn left navigation rail (desktop).
 *
 * Container: pulls the shared nav entries from {@link useSidebarNavItems} and
 * composes the {@link CollapsibleSidebar} block — which owns the collapse-in-place
 * animation, the toggle, the divider, and persisting the collapsed flag. Rows are
 * split into separator-divided clusters by their `group` (study / practice);
 * each row is a {@link SidebarNavItem} that self-dispatches its tab + navigation
 * through the shared select handler. Hidden below `lg` (mobile uses the drawer in
 * {@link import("../LearnMobileBar").LearnMobileBar}). `"use client"` for the hooks.
 *
 * @param props - {@link LearnSidebarProps}
 */
export const LearnSidebar = ({ className }: LearnSidebarProps) => {
    const t = useTranslations()
    // shared entries + active tab (also used by the mobile drawer)
    const { items, selectedTab, onSelect } = useSidebarNavItems()
    return (
        <CollapsibleSidebar
            title={t("nav.courseMenu")}
            collapseLabel={t("nav.collapseLeftRail")}
            expandLabel={t("nav.expandLeftRail")}
            storageKey={SIDEBAR_STORAGE_KEY}
            className={className}
        >
            {GROUP_ORDER.map((group, index) => {
                // rows belonging to this cluster, in their declared order
                const groupItems = items.filter((item) => item.group === group)
                if (groupItems.length === 0) {
                    return null
                }
                return (
                    // first cluster has no divider; later clusters get the full-width separator
                    <SidebarNavGroup key={group} divider={index > 0}>
                        {groupItems.map((item) => (
                            <SidebarNavItem
                                key={item.value}
                                icon={<item.icon className="size-5 shrink-0" />}
                                label={item.label}
                                isActive={selectedTab === item.tab}
                                endContent={item.locked ? (
                                    <LockSimpleIcon
                                        aria-label={t("enrollGate.locked")}
                                        focusable="false"
                                        className="size-4 text-muted"
                                    />
                                ) : undefined}
                                onPress={() => onSelect(item)}
                            />
                        ))}
                    </SidebarNavGroup>
                )
            })}
        </CollapsibleSidebar>
    )
}
