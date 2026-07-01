"use client"

import { StackIcon } from "@phosphor-icons/react"
import { cn } from "@heroui/react"
import React from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface FoundationCategoryThumbnailProps extends WithClassNames<undefined> {
    /**
     * Local square brand logo (e.g. `/foundations/docker.svg`). When set it wins
     * over {@link thumbnailUrl} and is rendered `object-contain` (a centred mark,
     * not a full-bleed banner) — used by the compact list leading.
     */
    logoSrc?: string | null
    /** Public thumbnail URL from API; when missing shows fallback icon. */
    thumbnailUrl?: string | null
    /** Category title for accessible image alt text. */
    title: string
}

/**
 * Foundation category artwork box. Renders, in priority order:
 * 1. a local square brand **logo** (`logoSrc`) `object-contain` — the crisp mark
 *    used in the compact list leading,
 * 2. else the synced 16:9 **banner** (`thumbnailUrl`) `object-cover`,
 * 3. else a centred fallback icon.
 *
 * @param props.logoSrc - Local square brand logo; takes precedence when present.
 * @param props.thumbnailUrl - Full URL to the 16:9 banner asset.
 * @param props.title - Category title used for accessible alt text.
 */
export const FoundationCategoryThumbnail = ({
    logoSrc,
    thumbnailUrl,
    title,
    className,
}: FoundationCategoryThumbnailProps) => {
    return (
        <div className={cn("relative aspect-video w-full shrink-0 overflow-hidden bg-accent/10", className)}>
            {logoSrc ? (
                <img
                    src={logoSrc}
                    alt={title}
                    className="absolute inset-0 block size-full object-contain p-2"
                />
            ) : thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt={title}
                    className="absolute inset-0 block h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <StackIcon className="text-accent/60 size-14" aria-hidden />
                </div>
            )}
        </div>
    )
}
