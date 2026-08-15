"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage, cn } from "@heroui/react"
import { UserIcon } from "@phosphor-icons/react"
import { avatarInitials, resolveAvatarSrc } from "@/utils/avatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link UserAvatar}. */
export interface UserAvatarProps extends WithClassNames<undefined> {
    /** Display username / name; drives the initials fallback + image alt text. */
    username?: string | null
    /** Uploaded avatar URL; when missing OR it fails to load, the chain falls through. */
    avatar?: string | null
    /**
     * Stable identity string (user id or username) seeding the GENERATED default face
     * when there is no uploaded photo. Same seed → same face, forever. Defaults to
     * {@link UserAvatarProps.username} when the caller has nothing better.
     */
    seed?: string | null
    /** HeroUI avatar size preset. */
    size?: "sm" | "md" | "lg"
}

/**
 * Shared user avatar with ONE fallback chain, everywhere:
 *   1. the user's uploaded image (when present and it loads),
 *   2. otherwise a generated (DiceBear) face seeded deterministically by
 *      `seed ?? username` — the same person always gets the same face,
 *   3. otherwise their initials on the soft `bg-default` tile HeroUI bakes into
 *      `Avatar.Fallback` — and a neutral person glyph when there are no usable
 *      initials at all (no name, or the caller only had a raw uuid).
 *
 * ⚠️ THE TRAP THIS FEATURE CARRIES (read before debugging an avatar).
 * The generated face was deliberately REMOVED in 31b11dd (2026-08-11) and is back now
 * only because the project owner asked for it. The reason it was pulled is still true
 * and is not a style opinion: a seeded face renders for EVERY avatar-less user, so a
 * mapper that silently drops `avatarUrl` looks exactly like "this user has no photo".
 * That is what happened — `toCommunityPost`/`toPostDetail`/`toReply`/`toSubjectPost`
 * read `displayName`+`username` and threw `avatarUrl` away even though the GraphQL
 * document already selected it, and the bug hid behind pretty faces for weeks.
 * So: when someone reports "my photo does not show", DO NOT start here. Check the
 * mapper for that surface first — the uploaded url always wins over the generated one
 * (see `resolveAvatarSrc`), so a generated face means the url never arrived.
 *
 * The chain still advances on LOAD FAILURE, not just on a missing URL: Radix only
 * mounts the `<img>` once it has decoded, so a broken uploaded URL — or DiceBear being
 * unreachable — simply leaves the initials tile on screen.
 *
 * @param props - {@link UserAvatarProps}
 */
export const UserAvatar = ({ username, avatar, seed, size, className }: UserAvatarProps) => {
    const src = resolveAvatarSrc(avatar, seed ?? username)
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
