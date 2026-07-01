import React from "react"
import { Avatar, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { UserAvatar } from "@/components/reuseable/UserAvatar"

/** One avatar in the group. */
export interface AvatarGroupUser {
    /** Username — drives the seeded fallback + alt. */
    username: string
    /** Display name (alt/title); falls back to username. */
    displayName?: string | null
    /** Avatar URL; null → seeded fallback. */
    avatar?: string | null
}

/** Props for the {@link AvatarGroup} block. */
export interface AvatarGroupProps extends WithClassNames<undefined> {
    /** Users to render, in order. */
    users: ReadonlyArray<AvatarGroupUser>
    /** Max avatars shown before the "+N" overflow chip. Defaults to 5. */
    max?: number
    /** Total count (for the "+N" overflow); defaults to `users.length`. */
    total?: number
}

/**
 * Overlapping avatar group ("who follows" style): a row of stacked, ring-bordered
 * avatars with an optional "+N" overflow counter. Pure + props-only; the block
 * owns the overlap + ring styling so feature code stays style-free. Reuses
 * {@link UserAvatar} so the seeded fallback matches the rest of the app.
 */
export const AvatarGroup = ({
    users,
    max = 5,
    total,
    className,
}: AvatarGroupProps) => {
    const visible = users.slice(0, max)
    const extra = Math.max((total ?? users.length) - visible.length, 0)

    return (
        <div className={cn("flex -space-x-2", className)}>
            {visible.map((user) => (
                <UserAvatar
                    key={user.username}
                    username={user.displayName ?? user.username}
                    avatar={user.avatar}
                    seed={user.username}
                    size="sm"
                    className="ring-2 ring-background"
                />
            ))}
            {extra > 0 ? (
                <Avatar size="sm" className="ring-2 ring-background">
                    <Avatar.Fallback>+{extra}</Avatar.Fallback>
                </Avatar>
            ) : null}
        </div>
    )
}
