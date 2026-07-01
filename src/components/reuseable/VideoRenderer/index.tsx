"use client"
import { cn } from "@heroui/react"
import React, { useMemo } from "react"
import { StandardPlayer } from "./Standard"
import { MpegDashPlayer } from "./MpegDash"
import { YoutubePlayer } from "./Youtube"
import { LessonVideoType } from "@/modules/types/enums/lesson-video-type"
import { VideoHostPlatform } from "@/modules/types/enums/video-host-platform"
import { VideoRendererType } from "@/modules/types/enums/video-renderer-type"
import { type WithClassNames } from "@/modules/types/base/class-name"

// ---------------------------------------------------------------------------
// Resolve which sub-player to use
// ---------------------------------------------------------------------------

/** True when the URL is a YouTube watch/share link. */
const isYoutubeUrl = (url?: string): boolean => /youtube\.com|youtu\.be/i.test(url ?? "")

/** True when the URL points at an MPEG-DASH `.mpd` manifest (ignoring query/hash). */
const isMpegDashUrl = (url?: string): boolean => /\.mpd(\?|#|$)/i.test(url ?? "")

const resolveRendererType = (
    url: string | undefined,
    videoType?: LessonVideoType,
    hostPlatform?: VideoHostPlatform,
): VideoRendererType => {
    // an explicit YouTube platform, or a YouTube URL, always wins
    if (hostPlatform === VideoHostPlatform.Youtube || isYoutubeUrl(url)) {
        return VideoRendererType.Youtube
    }
    // an explicit delivery format takes precedence over URL sniffing
    if (videoType === LessonVideoType.MpegDash) return VideoRendererType.MpegDash
    if (videoType === LessonVideoType.Standard) return VideoRendererType.Standard
    // no explicit type → infer from the URL: `.mpd` is DASH, everything else
    // (mp4/webm/…) plays through the native Standard player
    if (isMpegDashUrl(url)) return VideoRendererType.MpegDash
    return VideoRendererType.Standard
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface VideoRendererProps
    extends WithClassNames<{
        content?: string
        base?: string
    }> {
    url: string
    hostPlatform?: VideoHostPlatform
    /** Video delivery format — Standard (mp4) or MpegDash. Defaults to Standard. */
    videoType?: LessonVideoType
    /** Explicit renderer type override. Takes precedence over auto-resolve. */
    rendererType?: VideoRendererType
    title?: string
}

/**
 * Universal video renderer — picks 1 of 3 sub-players based on type:
 *
 * | Type       | Player          | Controls          |
 * |------------|-----------------|-------------------|
 * | Standard   | `<video>`       | Custom HeroUI     |
 * | MpegDash   | dashjs          | Custom + Quality  |
 * | Youtube    | iframe          | YouTube built-in  |
 */
export const VideoRenderer = ({
    url,
    hostPlatform,
    videoType,
    rendererType,
    title,
    classNames,
    className,
}: VideoRendererProps) => {
    const type =
        rendererType ?? resolveRendererType(url, videoType, hostPlatform)

    const renderContent = () => {
        if (!url?.trim()) {
            return (
                <div className="text-muted flex min-h-[12rem] items-center justify-center rounded-medium border border-dashed p-4 text-center text-sm">
                    No video URL.
                </div>
            )
        }

        switch (type) {
        case VideoRendererType.MpegDash:
            return (
                <MpegDashPlayer
                    src={url}
                    className={classNames?.content}
                />
            )
        case VideoRendererType.Youtube:
            return (
                <YoutubePlayer
                    url={url}
                    title={title}
                    className={classNames?.content}
                />
            )
        case VideoRendererType.Standard:
        default:
            return (
                <StandardPlayer
                    src={url}
                    className={classNames?.content}
                />
            )
        }
    }

    const content = useMemo(
        () => renderContent(),
        [url, type, title, classNames?.content],
    )

    return (
        <div
            className={cn(
                classNames?.base,
                className,
                "w-full aspect-video rounded-large overflow-hidden",
            )}
        >
            {content}
        </div>
    )
}
