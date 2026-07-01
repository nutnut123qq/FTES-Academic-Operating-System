"use client"

import { StackIcon } from "@phosphor-icons/react"
import { cn } from "@heroui/react"
import React, { useMemo } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface FoundationItemThumbnailProps extends WithClassNames<undefined> {
    /** Foundation-specific cover image URL (full-bleed when set). */
    thumbnailUrl?: string | null
    /** Accessible label for the image (usually foundation title). */
    title: string
    /** Visual size preset for list vs detail layouts. */
    size?: "card" | "detail"
}

/**
 * 16:9 media area: foundation thumbnail as full cover, or centered icon when missing.
 * @param props.thumbnailUrl - Per-foundation cover from API only (no category logo fallback).
 * @param props.title - Alt text for the image.
 * @param props.size - `card` for grid cards, `detail` for the item page header.
 */
export const FoundationItemThumbnail = ({
    thumbnailUrl,
    title,
    size = "card",
    className,
}: FoundationItemThumbnailProps) => {
    const resolvedThumbnailUrl = useMemo(
        () => thumbnailUrl?.trim() || undefined,
        [thumbnailUrl],
    )

    return (
        <div
            className={cn(
                "relative aspect-video w-full shrink-0 overflow-hidden bg-accent/10",
                size === "detail" && "max-h-72",
                className,
            )}
        >
            {resolvedThumbnailUrl ? (
                <img
                    src={resolvedThumbnailUrl}
                    alt={title}
                    className="absolute inset-0 block h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <StackIcon
                        className="text-accent/60 size-14"
                        aria-hidden
                    />
                </div>
            )}
        </div>
    )
}
