"use client"

import React from "react"
import {
    Card,
    CardContent,
    Typography,
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link MediaCard}. */
export interface MediaCardProps extends WithClassNames<undefined> {
    /**
     * Optional media node rendered flush at the very top of the card, outside
     * the padded body (e.g. an `<img className="aspect-video w-full object-cover" />`
     * cover, a thumbnail, or a gradient banner).
     */
    cover?: React.ReactNode
    /**
     * Primary heading of the card (course / lesson / challenge / blog title).
     * Rendered via {@link Typography} weight="medium" (body size).
     */
    title: React.ReactNode
    /**
     * Optional metadata row shown directly under the title — typically a row of
     * HeroUI Chips or muted text (category, difficulty, duration, author).
     */
    meta?: React.ReactNode
    /**
     * Optional short description / excerpt. Rendered muted via
     * {@link Typography} type="body-sm" color="muted". Two-line clamp
     * (className="line-clamp-2") is kept as a documented minimal exception —
     * it is a layout/overflow constraint, not a style class.
     */
    description?: React.ReactNode
    /**
     * Optional footer pinned at the bottom of the body — typically a CTA button,
     * price, or progress indicator.
     */
    footer?: React.ReactNode
    /**
     * Optional press handler. When provided the whole card becomes pressable and
     * keyboard-accessible. Prefer {@link href} for pure navigation.
     */
    onPress?: () => void
    /**
     * Optional destination URL. When provided the card renders as an anchor so
     * the whole card is a single accessible link.
     */
    href?: string
}

/**
 * Consolidated, presentational content card — one shape for course / lesson /
 * challenge / blog grids. Built on the HeroUI {@link Card}/{@link CardContent}
 * system (globals supply the 3xl radius, border, and no-shadow flat look), so it
 * never hand-writes rounded / border / background. The optional {@link cover}
 * sits flush at the top (outside padding); the padded body stacks title, meta,
 * description, and footer with a uniform `gap-3`.
 *
 * Pass `href` for navigation or `onPress` for a custom handler — either one makes
 * the entire card pressable and keyboard-accessible.
 *
 * @param props - {@link MediaCardProps}
 */
export const MediaCard = ({
    cover,
    title,
    meta,
    description,
    footer,
    onPress,
    href,
    className,
}: MediaCardProps) => {
    // HeroUI v3 Card is not pressable itself — wrap it in a real anchor/button
    // when interactive so the whole card is one accessible target.
    const interactive = Boolean(onPress || href)
    const card = (
        <Card className={cn("overflow-hidden", !interactive && className)}>
            {cover ?? null}
            <CardContent className="flex flex-col gap-3">
                <Typography weight="medium">{title}</Typography>
                {meta ? (
                    <div className="flex flex-wrap items-center gap-2">{meta}</div>
                ) : null}
                {description ? (
                    // line-clamp-2 is a layout/overflow constraint (minimal exception per LAW 2)
                    <Typography type="body-sm" color="muted" className="line-clamp-2">
                        {description}
                    </Typography>
                ) : null}
                {footer ? <div>{footer}</div> : null}
            </CardContent>
        </Card>
    )

    if (href) {
        return (
            <a
                href={href}
                className={cn("block", className)}
            >
                {card}
            </a>
        )
    }
    if (onPress) {
        return (
            <button
                type="button"
                onClick={onPress}
                className={cn("block w-full text-left", className)}
            >
                {card}
            </button>
        )
    }
    return card
}
