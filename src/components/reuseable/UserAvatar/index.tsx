"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage, cn } from "@heroui/react"
import { UserIcon } from "@phosphor-icons/react"
import { avatarInitials } from "@/utils/avatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link UserAvatar}. */
export interface UserAvatarProps extends WithClassNames<undefined> {
    /** Display username / name; drives the initials fallback + image alt text. */
    username?: string | null
    /** Uploaded avatar URL; when missing OR it fails to load, the initials tile is shown. */
    avatar?: string | null
    /**
     * @deprecated No longer used. It seeded the generated (DiceBear) default face, which
     * has been dropped — every avatar-less user now gets the SAME neutral initials tile.
     * Kept on the props so existing call sites keep compiling.
     */
    seed?: string | null
    /** HeroUI avatar size preset. */
    size?: "sm" | "md" | "lg"
}

/**
 * Shared user avatar with ONE fallback, everywhere:
 *   1. the user's uploaded image (when present and it loads),
 *   2. otherwise their initials on the soft `bg-default` tile HeroUI bakes into
 *      `Avatar.Fallback` — and a neutral person glyph when there are no usable
 *      initials at all (no name, or the caller only had a raw uuid).
 *
 * There is deliberately NO generated (DiceBear) face in the chain any more: those
 * random smileys read as "hiện tào lao" next to real photos, and they hid the real
 * bug — feed rows dropping `avatarUrl` on the floor and silently rendering a face
 * seeded by the author id. A missing avatar must LOOK missing.
 *
 * The chain still advances on LOAD FAILURE, not just on a missing URL: Radix only
 * mounts the `<img>` once it has decoded, so a stale/broken uploaded URL simply
 * leaves the fallback on screen.
 *
 * @param props - {@link UserAvatarProps}
 */
export const UserAvatar = ({ username, avatar, size, className }: UserAvatarProps) => {
    const src = avatar?.trim()
    const initials = avatarInitials(username)

    return (
        <Avatar size={size} className={cn(className)}>
            {src ? <AvatarImage src={src} alt={username ?? ""} /> : null}
            <AvatarFallback>
                {initials || <UserIcon aria-hidden focusable="false" className="size-1/2" />}
            </AvatarFallback>
        </Avatar>
    )
}
