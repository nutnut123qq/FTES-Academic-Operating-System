"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface YoutubePlayerProps extends WithClassNames<undefined> {
    /** YouTube video URL (watch, short, embed, youtu.be). */
    url: string
    title?: string
}

// ---------------------------------------------------------------------------
// URL parser — extract embed URL from any YouTube link format
// ---------------------------------------------------------------------------

const toYoutubeEmbedUrl = (raw: string): string | null => {
    const trimmed = raw.trim()
    if (!trimmed) return null

    try {
        const u = new URL(trimmed)
        const host = u.hostname.replace(/^www\./, "")

        if (
            host === "youtube.com" ||
            host === "m.youtube.com" ||
            host === "music.youtube.com"
        ) {
            const v = u.searchParams.get("v")
            if (v) return `https://www.youtube.com/embed/${v}`

            const parts = u.pathname.split("/").filter(Boolean)
            if (parts[0] === "embed" && parts[1])
                return `https://www.youtube.com/embed/${parts[1]}`
            if (parts[0] === "shorts" && parts[1])
                return `https://www.youtube.com/embed/${parts[1]}`
            if (parts[0] === "live" && parts[1])
                return `https://www.youtube.com/embed/${parts[1]}`
        }

        if (host === "youtu.be") {
            const id = u.pathname.split("/").filter(Boolean)[0]
            if (id) return `https://www.youtube.com/embed/${id}`
        }
    } catch {
        return null
    }
    return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * YouTube embed player — renders an iframe with no custom controls.
 */
export const YoutubePlayer = ({
    url,
    title = "YouTube video",
    className,
}: YoutubePlayerProps) => {
    const embedSrc = useMemo(() => toYoutubeEmbedUrl(url), [url])

    if (!embedSrc) {
        return (
            <div className={cn("text-muted flex min-h-[12rem] items-center justify-center rounded-medium border border-dashed p-4 text-center text-sm", className)}>
                Invalid or unsupported YouTube URL.
            </div>
        )
    }

    return (
        <iframe
            title={title}
            className={cn("aspect-video w-full rounded-large", className)}
            src={embedSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
        />
    )
}
