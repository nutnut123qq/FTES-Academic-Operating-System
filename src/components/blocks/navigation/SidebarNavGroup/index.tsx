"use client"

import React from "react"
import {
    Header,
    Separator,
    Typography,
    cn,
} from "@heroui/react"
import {
    useSidebarCollapsed,
} from "../CollapsibleSidebar/context"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for the {@link SidebarNavGroup} block. */
export interface SidebarNavGroupProps extends WithClassNames<undefined> {
    /** Uppercase section label shown above the rows (omit for an unlabelled group). */
    label?: string
    /** Render a full-width {@link Separator} above the group (use to divide groups). */
    divider?: boolean
    /** The {@link import("../SidebarNavItem").SidebarNavItem} rows. */
    children: React.ReactNode
}

/**
 * A cluster of sidebar rows: an optional full-width {@link Separator} divider on
 * top (to split groups), an optional muted uppercase caption, then the
 * {@link import("../SidebarNavItem").SidebarNavItem}s. The caption is hidden while
 * the sidebar is collapsed (icon rail) so only the divider separates icon clusters.
 * Owns the divider + caption styling + intra-group spacing.
 *
 * @param props - {@link SidebarNavGroupProps}
 */
export const SidebarNavGroup = ({
    label,
    divider = false,
    children,
    className,
}: SidebarNavGroupProps) => {
    const collapsed = useSidebarCollapsed()
    return (
        <div className={cn("flex flex-col", className)}>
            {/* Divider spans the rail's PADDED content width (lines up with the rows) —
                the single padding wrapper lives on CollapsibleSidebar, so this stays
                inset, not edge-to-edge. */}
            {divider ? <Separator className="mb-3" /> : null}
            {label && !collapsed ? (
                <Header>
                    <Typography
                        type="body-xs"
                        weight="medium"
                        color="muted"
                        className="tracking-wide"
                    >
                        {label}
                    </Typography>
                </Header>
            ) : null}
            {children}
        </div>
    )
}
