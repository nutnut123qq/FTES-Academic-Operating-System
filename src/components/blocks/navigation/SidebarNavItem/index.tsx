"use client"

import React from "react"
import {
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    useSidebarCollapsed,
} from "../CollapsibleSidebar/context"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for the {@link SidebarNavItem} block. */
export interface SidebarNavItemProps extends WithClassNames<undefined> {
    /** Leading icon (placement only — caller sizes it). */
    icon?: React.ReactNode
    /** Visible label text. */
    label: string
    /** Whether this is the current destination (accent fill). */
    isActive?: boolean
    /** Optional trailing content pinned to the row's right edge (e.g. a lock badge). Hidden when collapsed. */
    endContent?: React.ReactNode
    /** Fired when the row is activated. */
    onPress: () => void
}

/**
 * One row in a vertical settings/navigation sidebar: a leading icon + truncating
 * label. It is a navigation action, so it's a HeroUI {@link Link} (text-with-action
 * → Link, not a button), NOT a per-row `ListBox` — a one-item ListBox drags in
 * HeroUI's own hover/focus/selected grey chrome that fights the intended single
 * highlight. Here the ONLY filled state is `isActive` (accent tint); hover is a
 * faint tint and focus is a ring, never a fill. Owns ALL of its styling so
 * features only feed data + the active flag. Pair with
 * {@link import("../SidebarNavGroup").SidebarNavGroup}.
 *
 * @param props - {@link SidebarNavItemProps}
 */
export const SidebarNavItem = ({
    icon,
    label,
    isActive = false,
    endContent,
    onPress,
    className,
}: SidebarNavItemProps) => {
    // collapsed rail → icon only (label dropped; aria-label keeps it accessible)
    const collapsed = useSidebarCollapsed()
    return (
        <Link
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onPress={onPress}
            className={cn(
                "flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-large px-3 py-2 no-underline transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                isActive
                    ? "bg-accent/10 text-accent"
                    : "text-foreground hover:bg-default/40",
                collapsed && "mx-auto w-fit justify-center gap-0 px-2",
                className,
            )}
        >
            {icon}
            {!collapsed ? (
                <Typography
                    type="body-sm"
                    className={cn("min-w-0 flex-1", isActive ? "text-accent" : undefined)}
                    weight={isActive ? "medium" : "normal"}
                    truncate
                >
                    {label}
                </Typography>
            ) : null}
            {!collapsed && endContent ? (
                <span className="ml-auto shrink-0">{endContent}</span>
            ) : null}
        </Link>
    )
}
