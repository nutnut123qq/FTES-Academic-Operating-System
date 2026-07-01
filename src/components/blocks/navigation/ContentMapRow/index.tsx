"use client"

import React from "react"
import {
    Typography,
    cn,
} from "@heroui/react"
import {
    CheckCircleIcon,
    CircleIcon,
    LockIcon,
    StarIcon,
} from "@phosphor-icons/react"
import type {
    ReactNode,
} from "react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for the {@link ContentMapRow} block. */
export interface ContentMapRowProps extends WithClassNames<undefined> {
    /** Lesson title (the row's accessible name). */
    title: string
    /** Highlights the row as the lesson currently open. */
    isActive: boolean
    /** Read (green check) — highest-priority status marker. */
    isRead: boolean
    /** Locked (lock) — the viewer cannot open it yet (no access). */
    isLocked?: boolean
    /** Premium / VIP (star) — unlocked once enrolled; shown when not locked. */
    isPremium: boolean
    /** Optional right-aligned meta (e.g. the minutes-read label). */
    meta?: ReactNode
    /** Fired when the row is pressed (navigation handled by the caller). */
    onPress: () => void
}

/**
 * Single status marker per row, by priority: read → green check; locked → lock;
 * premium (accessible) → star; otherwise the plain "unread / reading" circle. Thin
 * outline icons (no fill weight); only the read state carries a (success) colour —
 * the rest stay neutral/muted.
 */
const resolveStatus = ({ isRead, isLocked, isPremium }: Pick<ContentMapRowProps, "isRead" | "isLocked" | "isPremium">) => {
    if (isRead) {
        return { Icon: CheckCircleIcon, tone: "text-success" }
    }
    if (isLocked) {
        return { Icon: LockIcon, tone: "text-muted" }
    }
    if (isPremium) {
        return { Icon: StarIcon, tone: "text-muted" }
    }
    return { Icon: CircleIcon, tone: "text-muted" }
}

/**
 * A single compact lesson row for the course content-map rail: a read marker, the
 * title (two-line clamp), an optional premium lock, and right-aligned meta. The
 * whole row is one press target; the active lesson gets an accent tint. Pure +
 * props-only — owns its look so features only compose it.
 *
 * @param props - {@link ContentMapRowProps}
 */
export const ContentMapRow = ({
    title,
    isActive,
    isRead,
    isLocked = false,
    isPremium,
    meta,
    onPress,
    className,
}: ContentMapRowProps) => {
    const { Icon, tone } = resolveStatus({ isRead, isLocked, isPremium })
    return (
        <button
            type="button"
            onClick={onPress}
            className={cn(
                "flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                isActive ? "bg-accent/10" : "hover:bg-surface-secondary",
                className,
            )}
        >
            {/* one thin status marker per row (read / locked / premium / unread) */}
            <Icon aria-hidden focusable="false" className={cn("mt-0.5 size-5 shrink-0", tone)} />
            <Typography
                type="body-sm"
                className={cn("line-clamp-2 min-w-0 flex-1", isActive && "text-accent")}
            >
                {title}
            </Typography>
            {meta ? <span className="mt-0.5 shrink-0">{meta}</span> : null}
        </button>
    )
}
