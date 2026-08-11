import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link InitialsAvatar}. */
export interface InitialsAvatarProps extends WithClassNames<undefined> {
    /**
     * Already-computed uppercase initials (e.g. `"NV"`). Takes initials rather than a
     * name on purpose: the leaderboard hooks derive them once, next to the
     * displayName/username fallback chain, so the block never has to guess which of
     * several name fields is the display one.
     */
    initials: string
    /**
     * Accessible name for the person, when the avatar is the ONLY thing naming them.
     * Omit (the default) where the name is rendered beside it — the tile is then
     * decorative and marked `aria-hidden`, so a screen reader does not read the
     * initials and the full name as two separate items.
     */
    label?: string
}

/**
 * Circular initials tile for a person with no avatar image — the tinted fallback used
 * by every ranked-people list (dashboard "Top learners", the `/leaderboard` board).
 *
 * Distinct from {@link import("../IconTile").IconTile}, which frames an ENTITY (course,
 * lesson) as a rounded square with an icon or cover image. This one is a person, always
 * a circle, always text.
 *
 * @param props - {@link InitialsAvatarProps}
 */
export const InitialsAvatar = ({ initials, label, className }: InitialsAvatarProps) => (
    <div
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? "img" : undefined}
        className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            "bg-accent/10 text-sm font-bold text-accent",
            className,
        )}
    >
        {initials}
    </div>
)
