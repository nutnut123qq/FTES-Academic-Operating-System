import React from "react"
import { Chip, cn } from "@heroui/react"
import { PushPinIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PinnedBadge}. */
export interface PinnedBadgeProps extends WithClassNames<undefined> {
    /** Localized label (e.g. "Đã ghim") — the owning feature supplies the copy. */
    label: string
}

/**
 * "Đã ghim" marker for a post an admin pinned (BE `Post.pinned`). Pure block: a
 * pin glyph + the localized label in one soft accent chip, shared by the feed row,
 * the post detail and the trending list so a pinned post reads the same everywhere.
 *
 * IT IS A BADGE ONLY. The BE already hoists pinned posts to the top of the first
 * page, so no surface may re-sort on this flag.
 *
 * @param props - {@link PinnedBadgeProps}
 */
export const PinnedBadge = ({ label, className }: PinnedBadgeProps) => (
    <Chip size="sm" variant="soft" color="accent" className={cn("w-fit shrink-0", className)}>
        <PushPinIcon weight="fill" aria-hidden focusable="false" className="size-4 shrink-0" />
        <Chip.Label>{label}</Chip.Label>
    </Chip>
)
