"use client"

import React, { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Visual tone of the tile (drives the tinted background + icon colour). */
export type IconTileTone = "accent" | "success" | "warning" | "danger" | "neutral"

/** Size of the tile. */
export type IconTileSize = "sm" | "md" | "lg"

/** Props for the {@link IconTile} block. */
export interface IconTileProps extends WithClassNames<undefined> {
    /** The icon (phosphor `*Icon`) — fallback when no {@link IconTileProps.src}. */
    icon: ReactNode
    /**
     * Optional cover image. When set, it FILLS the tile (`object-cover`, centered —
     * a 16:9 source is cropped to the square frame) instead of the icon; falls back
     * to {@link IconTileProps.icon} when absent/empty.
     */
    src?: string | null
    /** Alt text for the cover image (decorative tile — usually the entity title). */
    alt?: string
    /** Tinted background + icon colour. Defaults to "accent". */
    tone?: IconTileTone
    /** Tile size. Defaults to "md" (64px). */
    size?: IconTileSize
}

/** tone → tinted background + icon colour. */
const TONE: Record<IconTileTone, string> = {
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    neutral: "bg-default text-muted",
}

/** size → tile box + auto icon size + radius. */
const SIZE: Record<IconTileSize, string> = {
    sm: "size-12 rounded-xl [&_svg]:size-6",
    md: "size-16 rounded-2xl [&_svg]:size-8",
    lg: "size-20 rounded-2xl [&_svg]:size-10",
}

/**
 * A framed icon tile — a soft tinted square (`bg-{tone}/20`) with the icon
 * centered inside, used as the avatar of a *thing* (course, project, section…)
 * to give it breathing room and a consistent identity. The icon auto-sizes and
 * inherits the tone colour; pass it bare. Pure/props-only; owns its look.
 *
 * @param props - {@link IconTileProps}
 */
export const IconTile = ({
    icon,
    src,
    alt = "",
    tone = "accent",
    size = "md",
    className,
}: IconTileProps) => {
    // a broken cover URL (404 / unsynced asset) falls back to the icon instead of a
    // broken-image glyph; reset when the src changes.
    const [failed, setFailed] = useState(false)
    useEffect(() => setFailed(false), [src])
    const showImage = Boolean(src) && !failed

    return (
        <div
            aria-hidden
            className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden",
                SIZE[size],
                // skip the tint when a cover image fills the tile
                showImage ? null : TONE[tone],
                className,
            )}
        >
            {showImage ? (
                <img
                    src={src ?? undefined}
                    alt={alt}
                    className="size-full object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                icon
            )}
        </div>
    )
}
