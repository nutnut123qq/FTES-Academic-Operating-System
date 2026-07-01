import React from "react"
import { cn, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { UserAvatar } from "@/components/reuseable/UserAvatar"

/** Props for {@link UserCell}. */
export interface UserCellProps extends WithClassNames<undefined> {
    /** Account username; drives the avatar fallback and is the default display name. */
    username: string
    /** Human-friendly name shown as the primary label; falls back to {@link UserCellProps.username}. */
    displayName?: string
    /** Uploaded avatar URL; resilient fallbacks are handled by {@link UserAvatar}. */
    avatar?: string | null
    /** Secondary handle line (e.g. `@username`); hidden when omitted. */
    handle?: string
    /** Visual density of the row; controls the avatar preset. Defaults to `"sm"`. */
    size?: "sm" | "md"
    /** Optional right-aligned slot, e.g. a follow button or status chip. */
    trailing?: React.ReactNode
}

/**
 * Presentational person cell: avatar + name + optional `@handle`, with an optional
 * right-aligned trailing slot. Pure and props-only — no store or data access; the
 * caller supplies all text and any interactive controls via {@link UserCellProps.trailing}.
 *
 * Composes the shared {@link UserAvatar} so the avatar fallback chain stays consistent
 * everywhere a user is rendered. The text column truncates so the cell survives narrow
 * containers (`min-w-0`).
 *
 * @param props - {@link UserCellProps}
 */
export const UserCell = ({
    username,
    displayName,
    avatar,
    handle,
    size = "sm",
    trailing,
    className,
}: UserCellProps) => {
    const name = displayName ?? username

    return (
        <div className={cn("flex min-w-0 items-center gap-2", className)}>
            <UserAvatar
                username={username}
                avatar={avatar}
                seed={username}
                size={size}
            />
            <div className="flex min-w-0 flex-col gap-0">
                <Typography type="body-sm" weight="medium" truncate className="leading-5">{name}</Typography>
                {handle ? <Typography type="body-xs" color="muted" truncate className="leading-4">{handle}</Typography> : null}
            </div>
            {trailing ? <div className="ml-auto shrink-0">{trailing}</div> : null}
        </div>
    )
}
