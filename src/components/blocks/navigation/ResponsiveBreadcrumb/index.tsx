"use client"

import React from "react"
import type { ReactNode } from "react"
import { Breadcrumbs, Link, cn } from "@heroui/react"
import { CaretLeftIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One crumb in a {@link ResponsiveBreadcrumb} trail. */
export interface ResponsiveBreadcrumbItem {
    /** Stable key for the list. */
    key: string | number
    /** Crumb label. */
    label: ReactNode
    /** Navigate handler — omit on the current (last, read-only) crumb. */
    onPress?: () => void
}

/** Props for {@link ResponsiveBreadcrumb}. */
export interface ResponsiveBreadcrumbProps extends WithClassNames<undefined> {
    /** The full trail, root → current (current last, usually without `onPress`). */
    items: Array<ResponsiveBreadcrumbItem>
}

/**
 * Breadcrumb that adapts to screen width: the full `Home › … › Current` trail on
 * `sm`+ (desktop wayfinding), collapsed to a single back-link `‹ <parent>` on mobile
 * (the iOS / Polaris pattern — a long trail wraps + eats vertical space on a phone,
 * and the leftmost crumbs are already reachable from the top nav). The mobile target
 * is the deepest clickable ancestor (the last item with an `onPress`). Pure CSS
 * responsive — no JS. Drop into a `PageHeader` `breadcrumb` slot.
 *
 * @param props - {@link ResponsiveBreadcrumbProps}
 */
export const ResponsiveBreadcrumb = ({
    items,
    className,
}: ResponsiveBreadcrumbProps) => {
    // mobile back target = the deepest ancestor we can navigate to (skips the current crumb)
    const parent = [...items].reverse().find((item) => item.onPress)

    return (
        <>
            {/* desktop: the full trail */}
            <Breadcrumbs className={cn("hidden sm:flex", className)}>
                {items.map((item) => (
                    <Breadcrumbs.Item key={item.key} onPress={item.onPress}>
                        {item.label}
                    </Breadcrumbs.Item>
                ))}
            </Breadcrumbs>

            {/* mobile: a single back-link to the parent (omitted when nothing to go back to) */}
            {parent ? (
                <Link
                    onPress={parent.onPress}
                    className={cn("flex w-fit items-center gap-1 text-sm text-muted sm:hidden", className)}
                >
                    <CaretLeftIcon aria-hidden focusable="false" className="size-5 shrink-0" />
                    <span className="truncate">{parent.label}</span>
                </Link>
            ) : null}
        </>
    )
}

export default ResponsiveBreadcrumb
