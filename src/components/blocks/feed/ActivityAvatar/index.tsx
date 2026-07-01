import React from "react"
import type { ReactNode } from "react"
import { cn } from "@heroui/react"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link ActivityAvatar} block. */
export interface ActivityAvatarProps extends WithClassNames<undefined> {
    /** Main avatar's username — drives the image / initials fallback. */
    username: string
    /** Uploaded avatar URL (a generated default is used when missing). */
    avatar?: string | null
    /** Activity-type icon (phosphor `*Icon`) shown in the soft-accent badge. */
    icon: ReactNode
}

/**
 * Facebook-style feed avatar: a {@link UserAvatar} with a small activity-type icon
 * badge at the bottom-right. The badge is an OPAQUE soft-accent disc (a `bg-surface`
 * base under a `bg-accent/10` tint so the avatar never bleeds through) with an
 * accent icon, and a surface ring cuts it cleanly from the avatar. The owning
 * feature decides whose avatar is the main one (e.g. the followed user on a
 * "followed" event). Pure/props-only; owns its look.
 *
 * @param props - {@link ActivityAvatarProps}
 */
export const ActivityAvatar = ({
    username,
    avatar,
    icon,
    className,
}: ActivityAvatarProps) => {
    return (
        <div className={cn("relative shrink-0", className)}>
            <UserAvatar
                className="size-9"
                username={username}
                avatar={avatar ?? undefined}
                seed={username}
            />
            <span
                aria-hidden
                className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-surface ring-2 ring-surface"
            >
                <span className="flex size-full items-center justify-center rounded-full bg-accent/10 text-accent [&_svg]:size-3">
                    {icon}
                </span>
            </span>
        </div>
    )
}
