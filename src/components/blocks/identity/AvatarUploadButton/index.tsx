"use client"

import React from "react"
import { Button, cn } from "@heroui/react"
import { CameraIcon } from "@phosphor-icons/react"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AvatarUploadButton}. */
export interface AvatarUploadButtonProps extends WithClassNames<undefined> {
    /** Currently shown avatar URL (the saved image or a freshly-picked preview). */
    avatar?: string | null
    /** Display name; drives the avatar fallback initials + image alt text. */
    displayName?: string | null
    /** Stable identity used to seed the generated default avatar (email preferred). */
    seed?: string | null
    /** Accessible label for the icon-only trigger (e.g. "Change avatar"). */
    label: string
    /** Fired when the user activates the trigger to pick a new avatar. */
    onPress: () => void
}

/**
 * Circular avatar trigger that opens an avatar picker. Shows the current (or
 * preview) face inside a round frame and dims it with a centred camera icon on
 * hover/focus, hinting that the image is editable.
 *
 * Owns the full visual treatment (circular clip, hover-dim overlay, camera icon,
 * focus ring) so feature code only places it and wires {@link AvatarUploadButtonProps.onPress}.
 * Props-only — no store or data access; the caller supplies the avatar + identity.
 *
 * @param props - {@link AvatarUploadButtonProps}
 */
export const AvatarUploadButton = ({
    avatar,
    displayName,
    seed,
    label,
    onPress,
    className,
}: AvatarUploadButtonProps) => (
    <Button
        isIconOnly
        variant="ghost"
        onPress={onPress}
        aria-label={label}
        className={cn(
            "group relative size-20 shrink-0 overflow-hidden rounded-full p-0",
            className,
        )}
    >
        <UserAvatar
            username={displayName}
            avatar={avatar}
            seed={seed}
            size="lg"
            className="size-20 text-2xl"
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <CameraIcon aria-hidden focusable="false" className="size-6 text-white" />
        </span>
    </Button>
)
