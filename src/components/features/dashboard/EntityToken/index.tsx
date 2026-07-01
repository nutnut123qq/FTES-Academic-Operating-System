"use client"

import React from "react"
import {
    cn,
    Link,
} from "@heroui/react"
import {
    useResolveRouteNavigation,
} from "./useResolveRouteNavigation"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link EntityToken}. */
export interface EntityTokenProps extends WithClassNames<undefined> {
    /**
     * Opaque global id of the entity — resolved to a route on click. Omit when
     * passing a direct {@link EntityTokenProps.href} instead.
     */
    globalId?: string | null
    /**
     * Direct (already-built, locale-prefixed) route to push on click — use when the
     * caller already knows the path (e.g. a course `displayId`), skipping the
     * resolve round-trip. Takes precedence over {@link EntityTokenProps.globalId}.
     */
    href?: string
    /** Token text (username / lesson title …). */
    label: string
    /**
     * Render as a full-width left-rail row (truncated, hover bg) instead of an
     * inline accent link. Defaults to inline.
     */
    block?: boolean
}

/**
 * A clickable entity reference inside the feed (GitHub-style `<user>`/`<challenge>`
 * token). On click it asks the route index (`resolveRoute(globalId)`) where the
 * entity lives, then navigates — the dashboard has no course context, so the
 * server resolves the path. Renders as plain bold text when not routable.
 * @param props - the entity global id + label
 */
export const EntityToken = ({
    globalId,
    href,
    label,
    block = false,
    className,
}: EntityTokenProps) => {
    // resolve-and-navigate lives in a shared hook (also used by whole-row list items)
    const { onPress, pending, routable } = useResolveRouteNavigation({ globalId, href })

    // block (left-rail row): full-width, truncated, link-style — hover underlines the
    // label (like a <Link>), no block fill; flush (no px) so it aligns with the card edge.
    if (block) {
        return (
            <button
                type="button"
                disabled={!routable || pending}
                onClick={onPress}
                className={cn("truncate py-1 text-left text-sm text-muted transition-colors hover:text-foreground hover:underline disabled:opacity-60", className)}
            >
                {label}
            </button>
        )
    }

    // unresolvable target → non-interactive bold text
    if (!routable) {
        return (
            <span className="font-semibold text-foreground">{label}</span>
        )
    }

    return (
        <Link
            onPress={onPress}
            isDisabled={pending}
            className={cn("font-semibold text-foreground hover:underline disabled:opacity-6 text-sm", className)}
        >
            {label}
        </Link>
    )
}
