"use client"

import React from "react"
import { cn } from "@heroui/react"
import type { ReactionDescriptor } from "./constants"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Visual size for {@link ReactionEmoji}. */
export type ReactionEmojiSize = "xs" | "sm" | "md" | "lg"

/** Size token → square pixel size class (width + height). */
const SIZE_CLASS: Record<ReactionEmojiSize, string> = {
    xs: "size-4",
    sm: "size-5",
    md: "size-7",
    lg: "size-9",
}

/** Props for {@link ReactionEmoji}. */
export interface ReactionEmojiProps extends WithClassNames<undefined> {
    /** Descriptor for the reaction (provides the reaction `type` → SVG asset). */
    descriptor: ReactionDescriptor
    /** Visual size (default `"xs"` for inline use; `"md"` for the picker). */
    size?: ReactionEmojiSize
}

/**
 * Renders a single reaction as a coloured Fluent Emoji (Microsoft, MIT) SVG served from
 * `/public/reactions/<type>.svg` — the polished, OS-independent "Facebook-like" look
 * without reproducing Meta's proprietary reaction artwork. Decorative (`aria-hidden`);
 * the accessible label comes from the surrounding control. The filename matches the
 * `ReactionType` value exactly (like/love/haha/wow/sad/angry).
 *
 * @param props - {@link ReactionEmojiProps}
 */
export const ReactionEmoji = ({ descriptor, size = "xs", className }: ReactionEmojiProps) => (
    <img
        src={`/reactions/${descriptor.type}.svg`}
        alt=""
        aria-hidden
        draggable={false}
        className={cn("inline-block select-none", SIZE_CLASS[size], className)}
    />
)
