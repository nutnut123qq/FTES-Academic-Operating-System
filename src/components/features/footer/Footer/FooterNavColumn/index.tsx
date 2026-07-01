"use client"

import React from "react"
import {
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    useRouter,
} from "@/i18n/navigation"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** A single footer link: an internal `path` (locale-aware push) OR an external
 *  `href` (mailto / off-site) — exactly one is set. */
export interface FooterNavLink {
    /** Stable React key. */
    key: string
    /** Visible label. */
    label: string
    /** Internal route, locale-aware — pushed through the i18n router. */
    path?: string
    /** External / mailto href — rendered as a plain anchor. */
    href?: string
}

/** Props for {@link FooterNavColumn}. */
export interface FooterNavColumnProps extends WithClassNames<undefined> {
    /** Quiet column heading (e.g. "Khám phá", "Hỗ trợ"). */
    title: string
    /** Links stacked under the heading. */
    links: ReadonlyArray<FooterNavLink>
}

/**
 * FooterNavColumn — one quiet column of the global {@link Footer}: a small muted
 * heading over a vertical stack of links. Internal links (`path`) route through
 * the locale-aware router (so the top loader picks them up); external / mailto
 * links (`href`) render as plain anchors.
 *
 * `"use client"` for the router press handler. Presentational otherwise — owns its
 * spacing / typography; the caller supplies labels + targets.
 *
 * @param props - column `title`, `links`, and optional className (placement).
 */
export const FooterNavColumn = ({
    title,
    links,
    className,
}: FooterNavColumnProps) => {
    const router = useRouter()

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <Typography type="body-sm" weight="semibold">
                {title}
            </Typography>
            <ul className="flex flex-col gap-2">
                {links.map((link) => (
                    <li key={link.key}>
                        {link.href ? (
                            <Link
                                href={link.href}
                                className="text-sm text-muted transition-colors hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        ) : (
                            <Link
                                onPress={() => {
                                    if (link.path) {
                                        router.push(link.path)
                                    }
                                }}
                                className="cursor-pointer text-sm text-muted transition-colors hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
