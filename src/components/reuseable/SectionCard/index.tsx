"use client"

import React from "react"
import {
    Card,
    CardContent,
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link SectionCard}. */
export interface SectionCardProps extends WithClassNames<undefined> {
    /** Card body. */
    children: React.ReactNode
    /** Optional section title rendered in the header row. */
    title?: React.ReactNode
    /** Optional leading icon shown before the title. */
    icon?: React.ReactNode
    /** Optional action node pinned to the right of the header (button/link). */
    action?: React.ReactNode
    /** Accent variant: tinted border + background (highlight / "yours"). */
    accent?: boolean
    /** Extra classes merged onto the inner content wrapper. */
    contentClassName?: string
}

/**
 * The canonical bordered "viền" card used across profile + dashboard. A thin
 * wrapper over HeroUI {@link Card}/{@link CardContent} (globals already give it
 * the 3xl radius, p-3, no-shadow + border) that adds an optional header row
 * (icon + title on the left, action on the right) so every titled section looks
 * identical. Use `accent` for the viewer's own / highlighted cards.
 *
 * @param props - {@link SectionCardProps}
 */
export const SectionCard = ({
    children,
    title,
    icon,
    action,
    accent = false,
    className,
    contentClassName,
}: SectionCardProps) => {
    const hasHeader = Boolean(title || action || icon)
    return (
        <Card className={cn(accent && "border-accent/40 bg-accent/5", className)}>
            <CardContent className={cn("flex flex-col gap-3", contentClassName)}>
                {hasHeader ? (
                    <div className="flex items-center justify-between gap-3 border-b border-separator pb-3">
                        <div className="flex min-w-0 items-center gap-2">
                            {icon}
                            {title ? (
                                <span className="truncate text-base font-semibold tracking-tight text-foreground">
                                    {title}
                                </span>
                            ) : null}
                        </div>
                        {action ? <div className="shrink-0">{action}</div> : null}
                    </div>
                ) : null}
                {children}
            </CardContent>
        </Card>
    )
}
