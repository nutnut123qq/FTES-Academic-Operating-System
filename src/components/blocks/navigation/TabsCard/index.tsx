"use client"

import React, {
    type Key,
    type ReactNode,
} from "react"
import {
    Tabs,
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    ExtendedTabs,
} from "../ExtendedTabs"

/** One tab in a {@link TabsCardGroup}. */
export interface TabsCardItem {
    /** Stable id used as the selection key. */
    key: string
    /** Tab content (text, or an icon + text row). */
    label: ReactNode
    /** Optional leading icon rendered before the label. */
    icon?: ReactNode
    /** Render the tab but block selection. */
    isDisabled?: boolean
    /** Render muted — for a locked/premium tab that is still clickable (the parent
     * intercepts the selection, e.g. to open a paywall). */
    muted?: boolean
}

/** A controlled group of secondary tabs — one side of a {@link TabsCard}. */
export interface TabsCardGroup {
    /** Tabs in display order. */
    items: Array<TabsCardItem>
    /** Currently selected tab key. */
    selectedKey: string
    /** Accessible name for this group's tab list. */
    ariaLabel: string
    /** Fired with the newly selected tab key. */
    onSelectionChange: (key: Key) => void
}

/** Props for the {@link TabsCard} block. */
export interface TabsCardProps extends WithClassNames<undefined> {
    /** Primary tab group, pinned left. */
    leftTabs: TabsCardGroup
    /** Optional secondary tab group, pinned right (e.g. a language switcher). */
    rightTabs?: TabsCardGroup
}

/** Selected-state chrome shared by every tab (accent underline + accent text). */
const TAB_CLASS_NAME =
    "rounded-none data-[selected=true]:border-b-2 data-[selected=true]:border-accent data-[selected=true]:text-accent"

/**
 * Two secondary (underline) tab groups sharing one toolbar row: `leftTabs` pinned
 * left, optional `rightTabs` pinned right, a `gap-3` gutter between them. Both sides
 * use the same secondary chrome (no primary), so the row reads as one nav layer —
 * e.g. content tabs on the left and a language switcher on the right. Pass each side
 * as data (items + selectedKey + onSelectionChange); the block owns all styling.
 *
 * @param props - {@link TabsCardProps}
 */
export const TabsCard = ({
    leftTabs,
    rightTabs,
    className,
}: TabsCardProps) => {
    /** Render one controlled secondary tab group. */
    const renderGroup = (group: TabsCardGroup): ReactNode => (
        <ExtendedTabs
            selectedKey={group.selectedKey}
            onSelectionChange={group.onSelectionChange}
        >
            <Tabs.ListContainer>
                <Tabs.List aria-label={group.ariaLabel}>
                    {group.items.map((item) => (
                        <Tabs.Tab
                            key={item.key}
                            id={item.key}
                            isDisabled={item.isDisabled}
                            className={cn(TAB_CLASS_NAME, item.muted && "text-muted")}
                        >
                            <span className="flex items-center gap-2">
                                {item.icon}
                                {/* a tab WITH an icon hides its label visually on mobile
                                    (icon-only) and shows it from sm up; `sr-only` keeps the
                                    accessible name on mobile. An icon-less tab always shows it. */}
                                {item.label ? (
                                    <span className={cn(item.icon && "sr-only sm:not-sr-only")}>
                                        {item.label}
                                    </span>
                                ) : null}
                            </span>
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs.ListContainer>
        </ExtendedTabs>
    )

    return (
        <div className={cn("flex items-center justify-between gap-3", className)}>
            {renderGroup(leftTabs)}
            {rightTabs ? renderGroup(rightTabs) : null}
        </div>
    )
}
