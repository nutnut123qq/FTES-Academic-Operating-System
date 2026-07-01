"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage, cn } from "@heroui/react"
import { dicebearAvatarUrl } from "@/utils/avatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link UserAvatar}. */
export interface UserAvatarProps extends WithClassNames<undefined> {
    /** Display username; drives the initials fallback + image alt text. */
    username?: string | null
    /** Uploaded avatar URL; when missing OR it fails to load, a generated default is shown. */
    avatar?: string | null
    /**
     * Stable identity used to seed the generated default avatar (email preferred,
     * else username/name). Falls back to `username` when omitted.
     */
    seed?: string | null
    /** HeroUI avatar size preset. */
    size?: "sm" | "md" | "lg"
}

/**
 * Shared user avatar with a resilient fallback chain:
 *   1. the user's uploaded image (when present),
 *   2. a deterministic generated (DiceBear) avatar seeded by their identity,
 *   3. the first two letters of their username, as a last resort.
 *
 * Crucially the chain advances on *load failure*, not just on a missing URL — so a
 * stale/broken uploaded URL still resolves to the generated face instead of bare
 * initials. Same seed → same face everywhere the user is shown.
 *
 * @param props - {@link UserAvatarProps}
 */
export const UserAvatar = ({ username, avatar, seed, size, className }: UserAvatarProps) => {
    // last-resort fallback if even the generated image fails to load
    const initials = (username ?? "").slice(0, 2).toUpperCase()
    // ordered image candidates: uploaded first, then the stable generated default
    const candidates = React.useMemo(() => {
        const uploaded = avatar?.trim()
        const generated = dicebearAvatarUrl((seed ?? username) ?? "")
        return uploaded ? [uploaded, generated] : [generated]
    }, [avatar, seed, username])

    // index of the candidate currently being attempted; advances on load error.
    // keyed by the candidate signature so it resets when the user/avatar changes.
    const signature = candidates.join("|")
    const [state, setState] = React.useState({ signature, index: 0 })
    const index = state.signature === signature ? state.index : 0
    const src = candidates[index]

    return (
        <Avatar size={size} className={cn(className)}>
            {/*
              Radix only mounts the <img> once it has loaded, so a broken src never
              fires onError on the element — it reports failure via onLoadingStatusChange.
              On "error" we advance to the next candidate; when exhausted, the fallback shows.
            */}
            {src ? (
                <AvatarImage
                    src={src}
                    alt={username ?? ""}
                    onLoadingStatusChange={(status) => {
                        if (status === "error") {
                            setState({ signature, index: index + 1 })
                        }
                    }}
                />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
    )
}
