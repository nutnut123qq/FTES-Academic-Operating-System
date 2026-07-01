"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for the {@link PressableCard} block. */
export interface PressableCardProps extends WithClassNames<undefined> {
    /** Card body — composed freely by the caller (icon tiles, text, chips…). */
    children: React.ReactNode
    /**
     * Press handler for an action card (select / toggle). Ignored when
     * {@link PressableCardProps.href} is set. One of `onPress` / `href` should
     * be provided for the card to be interactive.
     */
    onPress?: () => void
    /** Navigation target — renders the card as an anchor when provided. */
    href?: string
    /** Disables interaction and dims the card (action cards only). */
    isDisabled?: boolean
}

/**
 * A whole-card press target with the default surface card look (surface fill,
 * concentric `rounded-3xl`, fixed `px-4 py-3` padding, no shadow) plus a hover
 * tint and keyboard focus ring. Exists because HeroUI v3 `Card` is a non-interactive
 * `<div>` — this block owns the card styling on a real `<button>` / `<a>` so
 * features can compose a clickable card without hand-rolling styles (per the
 * no-style-in-features rule). Use for navigation tiles, selectable option cards,
 * and bookmark rows.
 *
 * @param props - {@link PressableCardProps}
 */
export const PressableCard = ({
    children,
    onPress,
    href,
    isDisabled = false,
    className,
}: PressableCardProps) => {
    const base = cn(
        "block w-full rounded-3xl bg-surface px-4 py-3 text-left outline-none transition-colors",
        "hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-accent",
        isDisabled && "cursor-not-allowed opacity-60",
        className,
    )

    if (href && !isDisabled) {
        return (
            <a href={href} className={base}>
                {children}
            </a>
        )
    }

    return (
        <button
            type="button"
            onClick={onPress}
            disabled={isDisabled}
            className={cn(base, !isDisabled && "cursor-pointer")}
        >
            {children}
        </button>
    )
}
