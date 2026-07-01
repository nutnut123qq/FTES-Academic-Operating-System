"use client"

import React from "react"
import { cn, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SurfaceListCard}. */
export interface SurfaceListCardProps extends WithClassNames<undefined> {
    /** The rows ({@link SurfaceListCardRow}) of the joined list. */
    children: React.ReactNode
}

/**
 * Bounded SURFACE list card: one `bg-surface` container with a border + large
 * radius, holding {@link SurfaceListCardRow}s edge-to-edge (the `Accordion
 * variant="surface"` skin — NOT a real accordion). Each row owns the inset
 * separator + hover; the last row hides its separator automatically.
 *
 * Use for a list of clickable items that should read as ONE card (foundation
 * categories/resources, payment methods…), not N separate cards. Style lives
 * here (block); features only feed rows. Ref `elements/card.md` §3c.
 *
 * @param props - {@link SurfaceListCardProps}
 */
export const SurfaceListCard = ({ children, className }: SurfaceListCardProps) => (
    <div className={cn("overflow-hidden rounded-3xl border border-default bg-surface", className)}>
        {children}
    </div>
)

/** Props for {@link SurfaceListCardRow}. */
export interface SurfaceListCardRowProps extends WithClassNames<undefined> {
    /** Optional leading node (thumbnail/icon), kept at intrinsic size. */
    leading?: React.ReactNode
    /** Primary line — medium foreground, single-line truncate. */
    title: React.ReactNode
    /** Optional secondary line — muted, smaller, single-line truncate. */
    subtitle?: React.ReactNode
    /** Optional right-aligned metadata (chips/counts) before the trailing node. */
    meta?: React.ReactNode
    /** Optional far-right node (caret / inline action). */
    trailing?: React.ReactNode
    /** Press handler → renders an interactive `<button>` row. */
    onPress?: () => void
    /** Link target → renders an `<a>` row that navigates on click. */
    href?: string
    /** Tints the row as the active selection. */
    selected?: boolean
    /** Disables the row (dimmed, non-interactive). */
    isDisabled?: boolean
    /**
     * Hover treatment. `"fill"` (default) tints the whole row (`bg-default`) — for
     * card-like rows / bounded objects. `"underline"` is link-style: the TITLE
     * underlines on hover with NO row fill — for a list whose title IS the link
     * (e.g. a most-read list). Ref `interactive-needs-hover` (row-as-link → underline
     * the label, don't colour the whole block).
     */
    hover?: "fill" | "underline"
}

/**
 * One interactive row of a {@link SurfaceListCard}: a full-width `<button>` (or
 * `<a>`) with `hover:bg-default`, focus ring, and an inset bottom separator
 * (`after:`), auto-hidden on the last row. Lays out leading · title+subtitle ·
 * meta+trailing — the same slot shape as `ListRow` but with the surface-card skin.
 *
 * @param props - {@link SurfaceListCardRowProps}
 */
export const SurfaceListCardRow = ({
    leading,
    title,
    subtitle,
    meta,
    trailing,
    onPress,
    href,
    selected = false,
    isDisabled = false,
    hover = "fill",
    className,
}: SurfaceListCardRowProps) => {
    const underlineHover = hover === "underline"
    const rowClassName = cn(
        "relative flex w-full items-center gap-3 px-4 py-4 text-left outline-none transition-colors",
        // link-style rows form a hover `group` (the title underlines) with no fill;
        // card-style rows tint the whole row
        underlineHover ? "group" : "hover:bg-default",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
        "disabled:cursor-not-allowed disabled:opacity-60",
        // inset separator, hidden on the last row of the card
        "after:absolute after:bottom-0 after:left-[3%] after:h-px after:w-[94%] after:bg-surface-foreground/6 after:content-['']",
        "last:after:hidden",
        !isDisabled && (onPress || href) && "cursor-pointer",
        selected && "bg-accent/10",
        className,
    )

    const content = (
        <>
            {leading ? <div className="shrink-0">{leading}</div> : null}
            <div className="flex min-w-0 flex-col gap-0">
                <Typography
                    type="body-sm"
                    weight="medium"
                    truncate
                    className={cn(underlineHover && "group-hover:underline")}
                >
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

    if (href) {
        return (
            <a href={href} onClick={onPress} className={rowClassName}>
                {content}
            </a>
        )
    }

    return (
        <button type="button" onClick={onPress} disabled={isDisabled} className={rowClassName}>
            {content}
        </button>
    )
}

/** Props for {@link SurfaceListCardItem}. */
export interface SurfaceListCardItemProps extends WithClassNames<undefined> {
    /** Arbitrary row content (the block owns padding + the inset separator). */
    children: React.ReactNode
    /** Press handler → renders an interactive `<button>` row (hover + focus ring). */
    onPress?: () => void
    /** Link target → renders an `<a>` row that navigates on click. */
    href?: string
    /** Disables the interactive row (dimmed, non-interactive). */
    isDisabled?: boolean
    /**
     * Hover treatment for an interactive row. `"fill"` (default) tints the whole
     * row (`bg-default`) — the accordion-skin hover, for SELECT/expand rows that
     * keep you on the surface (e.g. payment methods). `"underline"` makes the row a
     * hover `group` with NO fill — for a NAV row whose title is a link (navigates
     * away); the feature adds `group-hover:underline` to its title. Ref
     * `hover-style-matches-clickable-nature` (go-there → underline, stay-here → fill).
     */
    hover?: "fill" | "underline"
}

/**
 * One free-form row of a {@link SurfaceListCard} — bespoke content (not the fixed
 * leading/title/subtitle slots of {@link SurfaceListCardRow}). The block owns the
 * row padding + inset bottom separator (auto-hidden on the last row); the feature
 * lays out whatever it needs inside (e.g. a changelog entry, or a course row with a
 * progress bar). STATIC by default; pass `onPress`/`href` to make the WHOLE row a
 * tappable `<button>`/`<a>`. `hover="fill"` (default) tints the row (accordion skin);
 * `hover="underline"` is link-style (the row is a `group`, no fill — the feature
 * underlines its own title). Ref `elements/card.md` §3b/§3c.
 *
 * @param props - {@link SurfaceListCardItemProps}
 */
export const SurfaceListCardItem = ({
    children,
    onPress,
    href,
    isDisabled = false,
    hover = "fill",
    className,
}: SurfaceListCardItemProps) => {
    const interactive = Boolean(onPress || href)
    const itemClassName = cn(
        "relative block w-full px-4 py-4 text-left",
        // inset separator, hidden on the last row of the card
        "after:absolute after:bottom-0 after:left-[3%] after:h-px after:w-[94%] after:bg-surface-foreground/6 after:content-['']",
        "last:after:hidden",
        interactive && "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
        // link-style rows form a hover `group` (the title underlines) with NO fill;
        // select/expand rows tint the whole row (accordion skin)
        interactive && (hover === "underline" ? "group" : "hover:bg-default"),
        interactive && !isDisabled && "cursor-pointer",
        isDisabled && "cursor-not-allowed opacity-60",
        className,
    )

    if (href) {
        return (
            <a href={href} onClick={onPress} className={itemClassName}>
                {children}
            </a>
        )
    }
    if (onPress) {
        return (
            <button type="button" onClick={onPress} disabled={isDisabled} className={itemClassName}>
                {children}
            </button>
        )
    }
    return <div className={itemClassName}>{children}</div>
}
