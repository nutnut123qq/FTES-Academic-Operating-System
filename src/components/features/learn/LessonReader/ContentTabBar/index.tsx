"use client"

import React, {
    useMemo,
    type Key,
} from "react"
import {
    cn,
} from "@heroui/react"
import type {
    ContentTabItem,
} from "../types"
import {
    CONTENT_TAB_ICON_MAP,
} from "../map"
import {
    TabTrigger,
} from "./TabTrigger"
import { TabsCard, type TabsCardGroup } from "@/components/blocks/navigation/TabsCard"
import type { ContentTab } from "@/redux/slices/tabs"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ContentTabBar}. */
export interface ContentTabBarProps extends WithClassNames<undefined> {
    /** Tabs to render, in display order. */
    tabItems: Array<ContentTabItem>
    /** Currently selected tab key. */
    selectedKey: ContentTab
    /** Accessible name for the tab list. */
    ariaLabel: string
    /** Fired with the newly selected tab key. */
    onSelectionChange: (key: Key) => void
    /**
     * Optional right-aligned tab group on the SAME row (e.g. the programming-language
     * switcher) — keeps the reader to a single toolbar layer instead of a second strip.
     */
    rightTabs?: TabsCardGroup
}

/**
 * Secondary tab bar shown above the content body (loading and loaded states).
 *
 * Builds the left tab group from {@link ContentTabItem} rows (icon + label, lock glyph
 * for gated tabs) and hands it — plus an optional right group — to {@link TabsCard}.
 * Owns only the lesson-reader chrome (full-width underline + reading-width cap).
 * @param props - tab items, selected key, a11y label, selection callback, right group
 */
export const ContentTabBar = ({
    tabItems,
    selectedKey,
    ariaLabel,
    onSelectionChange,
    className,
    rightTabs,
}: ContentTabBarProps) => {
    /** Left group: content tabs mapped to TabsCard items (icon + label + lock). */
    const leftTabs = useMemo<TabsCardGroup>(
        () => ({
            ariaLabel,
            selectedKey,
            onSelectionChange,
            items: tabItems.map((item) => ({
                key: item.key,
                muted: item.locked,
                label: (
                    <TabTrigger
                        icon={CONTENT_TAB_ICON_MAP[item.key]}
                        label={item.label}
                        locked={item.locked}
                    />
                ),
            })),
        }),
        [tabItems, selectedKey, ariaLabel, onSelectionChange],
    )

    return (
        // no divider line under the row — the toolbar floats above the reading card
        <div className={cn("w-full", className)}>
            {/* capped + centered wrapper so the toolbar lines up with the reading column */}
            <TabsCard
                className="mx-auto w-full max-w-3xl"
                leftTabs={leftTabs}
                rightTabs={rightTabs}
            />
        </div>
    )
}
