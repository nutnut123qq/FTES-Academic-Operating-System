"use client"

import React from "react"
import { cn, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ListRow}. */
export interface ListRowProps extends WithClassNames<undefined> {
    /**
     * Optional leading node rendered before the text column, kept at its
     * intrinsic size (icon or avatar). Does not shrink.
     */
    leading?: React.ReactNode
    /**
     * Primary line of the row. Rendered as medium-weight foreground text and
     * truncated to a single line when it overflows.
     */
    title: React.ReactNode
    /**
     * Optional secondary line shown beneath the title in muted, smaller text and
     * truncated to a single line.
     */
    subtitle?: React.ReactNode
    /**
     * Optional right-aligned metadata (chips / counts / timestamps) rendered
     * before the trailing node.
     */
    meta?: React.ReactNode
    /**
     * Optional far-right node, typically a chevron or inline action, rendered
     * after the meta content.
     */
    trailing?: React.ReactNode
    /**
     * When true, adds a bottom border so consecutive same-type rows read as a
     * separated list. Omit on the final row of a group.
     */
    divider?: boolean
    /**
     * Optional press handler. When provided (or {@link ListRowProps.href} is
     * set) the row becomes interactive with a hover surface and is keyboard /
     * screen-reader accessible.
     */
    onPress?: () => void
    /**
     * Optional link target. When provided the row renders as an anchor so the
     * whole row navigates on click.
     */
    href?: string
}

/**
 * Generic GitHub-style list row designed to live inside a
 * {@link import("@/components/reuseable").SectionCard}. Lays out an optional
 * leading icon/avatar, a title + optional subtitle text column, and a
 * right-aligned meta + trailing cluster. Purely presentational: text and
 * handlers arrive via props so the row stays store-free and reusable.
 *
 * @param props - {@link ListRowProps}
 */
export const ListRow = ({
    leading,
    title,
    subtitle,
    meta,
    trailing,
    divider = false,
    onPress,
    href,
    className,
}: ListRowProps) => {
    const isPressable = Boolean(onPress || href)

    const content = (
        <>
            {leading ? <div className="shrink-0">{leading}</div> : null}
            <div className="flex min-w-0 flex-col gap-0">
                <Typography type="body-sm" weight="medium" truncate>
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography type="body-xs" color="muted" truncate>
                        {subtitle}
                    </Typography>
                ) : null}
            </div>
            {meta || trailing ? (
                <div className="ml-auto flex shrink-0 items-center gap-2">
                    {meta}
                    {trailing}
                </div>
            ) : null}
        </>
    )

    const baseClassName = cn(
        "flex min-w-0 items-center gap-3 py-2",
        divider && "border-b border-separator",
        isPressable &&
            "rounded-2xl transition-colors hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:outline-none",
        className,
    )

    if (href) {
        return (
            <a href={href} onClick={onPress} className={baseClassName}>
                {content}
            </a>
        )
    }

    if (onPress) {
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={onPress}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onPress()
                    }
                }}
                className={cn(baseClassName, "cursor-pointer")}
            >
                {content}
            </div>
        )
    }

    return <div className={baseClassName}>{content}</div>
}
