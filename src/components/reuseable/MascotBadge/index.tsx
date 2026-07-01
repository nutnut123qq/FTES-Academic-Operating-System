"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    Medal as MedalIcon,
} from "@gravity-ui/icons"
import {
    BadgeImage,
} from "@/components/reuseable/BadgeImage"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { getRank } from "@/modules/utils/rank"

/** Props for {@link MascotBadge}. */
export interface MascotBadgeProps extends WithClassNames<undefined> {
    /** MinIO object key of the mascot art (bare animal, no baked frame). */
    objectKey: string
    /** Accessible name of the mascot. */
    name: string
    /** Whether the viewer has earned the badge at all. */
    earned: boolean
    /** Highest tier reached (1–4), or null; drives the ring colour via rank. */
    tierReached: number | null
    /** Outer diameter in px (default 64). */
    size?: number
}

/**
 * A mascot badge: the bare animal art framed by a circular ring whose colour
 * encodes the viewer's rank (grey → bronze → silver → gold). Locked badges show
 * the art greyed-out inside a dashed neutral ring. One image per animal — only
 * the ring colour changes across ranks, so art never has to be redrawn per tier.
 *
 * @param props - {@link MascotBadgeProps}
 */
export const MascotBadge = ({
    objectKey,
    name,
    earned,
    tierReached,
    size = 64,
    className,
}: MascotBadgeProps) => {
    const {
        rank,
        ring,
    } = getRank(earned, tierReached)
    // ring thickness + inner art scale with the badge so it reads at any size.
    // the art fills the full content box (box-sizing: border-box → already minus
    // the border) so the ring sits FLUSH against the mascot — no transparent gap.
    const ringWidth = Math.max(3, Math.round(size * 0.06))
    const innerSize = size - ringWidth * 2

    return (
        <div
            className={cn(
                // clip the (slightly over-scaled) art to the ring so the mascot
                // hugs the ring with no transparent gap from the PNG's own padding
                "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
                !rank && "border-dashed border-default-300",
                className,
            )}
            style={{
                width: size,
                height: size,
                // earned → solid metallic rank ring; locked → dashed neutral (class)
                ...(rank
                    ? { border: `${ringWidth}px solid ${ring}` }
                    : { borderWidth: ringWidth }),
            }}
        >
            <BadgeImage
                objectKey={objectKey}
                size={innerSize}
                alt={name}
                className={cn(
                    // scale up to eat the art's built-in transparent margin so the
                    // visible animal reaches the ring (overflow clipped by parent)
                    "rounded-full object-cover scale-[1.18]",
                    !earned && "opacity-40 grayscale",
                )}
                fallback={(
                    <MedalIcon
                        width={innerSize}
                        height={innerSize}
                        className={cn(earned ? "text-warning" : "text-default-400")}
                    />
                )}
            />
        </div>
    )
}
