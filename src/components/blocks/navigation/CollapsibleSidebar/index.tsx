"use client"

import React, {
    useEffect,
    useState,
} from "react"
import {
    motion,
    AnimatePresence,
    useReducedMotion,
} from "framer-motion"
import {
    Button,
    ScrollShadow,
    Typography,
    cn,
} from "@heroui/react"
import {
    SidebarSimpleIcon,
} from "@phosphor-icons/react"
import {
    SidebarCollapsedContext,
} from "./context"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Expanded panel width (full nav). */
const EXPANDED_WIDTH = "16rem"
/** Collapsed rail width — fits a centered icon row + the toggle. */
const COLLAPSED_WIDTH = "4rem"

/** Props for the {@link CollapsibleSidebar} block. */
export interface CollapsibleSidebarProps extends WithClassNames<undefined> {
    /** Heading shown in the panel header (hidden while collapsed). */
    title: string
    /** Accessible label for the collapse toggle (expanded state). */
    collapseLabel: string
    /** Accessible label for the expand toggle (collapsed state). */
    expandLabel: string
    /**
     * Stable key under which the collapsed flag persists in `localStorage`, so the
     * choice survives navigation between pages that share this sidebar.
     */
    storageKey: string
    /** The panel body — typically grouped {@link import("../SidebarNavGroup").SidebarNavGroup}s. */
    children: React.ReactNode
}

/**
 * A left navigation sidebar that collapses IN PLACE: the panel animates between a
 * full {@link EXPANDED_WIDTH} (title + nav) and a thin {@link COLLAPSED_WIDTH}
 * rail (just the toggle), and the surrounding content reflows beside it — no
 * overlay / Drawer. Owns ALL the chrome: the vertical divider, the framer-motion
 * width animation (disabled under `prefers-reduced-motion`), the
 * {@link SidebarSimpleIcon} toggle, and persisting the collapsed flag to
 * `localStorage`. Features only feed `title` + the nav rows.
 *
 * Self-contained: the collapsed state is local UI chrome, hydrated from storage
 * on mount (SSR-safe — starts expanded, then syncs).
 *
 * @param props - {@link CollapsibleSidebarProps}
 */
export const CollapsibleSidebar = ({
    title,
    collapseLabel,
    expandLabel,
    storageKey,
    children,
    className,
}: CollapsibleSidebarProps) => {
    const reduceMotion = useReducedMotion()
    const [collapsed, setCollapsed] = useState(false)

    // hydrate the persisted choice after mount (avoids SSR/client mismatch)
    useEffect(() => {
        const stored = window.localStorage.getItem(storageKey)
        if (stored !== null) {
            setCollapsed(stored === "true")
        }
    }, [storageKey])

    /** Flip + persist the collapsed flag. */
    const toggle = () => {
        setCollapsed((prev) => {
            const next = !prev
            window.localStorage.setItem(storageKey, String(next))
            return next
        })
    }

    return (
        <SidebarCollapsedContext.Provider value={collapsed}>
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
                className={cn(
                    // ONE padding wrapper for the whole rail: p-6 expanded / px-3 py-6
                    // collapsed. Header, rows and group dividers all sit inside it, so
                    // the dividers span the PADDED width (lined up with the rows), not
                    // edge-to-edge. The border-r is on the box → flush, full-height.
                    "flex h-full shrink-0 flex-col overflow-hidden border-r border-separator",
                    collapsed ? "px-3 py-6" : "p-6",
                    className,
                )}
            >
                {/* header: toggle always present; title fades out while collapsed */}
                <div
                    className={cn(
                        "mb-6 flex items-center gap-2",
                        collapsed ? "justify-center" : "justify-between",
                    )}
                >
                    <AnimatePresence initial={false}>
                        {!collapsed ? (
                            <motion.div
                                key="title"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
                                className="min-w-0"
                            >
                                <Typography type="h5" weight="bold" truncate>
                                    {title}
                                </Typography>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                    <Button
                        isIconOnly
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        aria-label={collapsed ? expandLabel : collapseLabel}
                        aria-expanded={!collapsed}
                        onPress={toggle}
                    >
                        <SidebarSimpleIcon className="size-5" />
                    </Button>
                </div>

                {/* body: the nav — ALWAYS rendered; rows drop to icon-only in the rail
                    (via SidebarCollapsedContext). A HeroUI ScrollShadow owns the overflow
                    so a long nav scrolls on its own (the sanctioned sidebar-nav slot). */}
                <nav className="flex min-h-0 flex-1 flex-col">
                    <ScrollShadow
                        hideScrollBar
                        size={40}
                        className={cn("flex flex-col gap-3 overflow-y-auto", collapsed && "items-stretch")}
                    >
                        {children}
                    </ScrollShadow>
                </nav>
            </motion.aside>
        </SidebarCollapsedContext.Provider>
    )
}
