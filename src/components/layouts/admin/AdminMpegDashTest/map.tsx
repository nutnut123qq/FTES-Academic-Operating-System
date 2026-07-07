import { BroadcastIcon, PlayIcon } from "@phosphor-icons/react"
import React from "react"
import type { RendererTypeOption } from "./types"
import { VideoRendererType } from "@/modules/types/enums/video-renderer-type"

/**
 * Selector option metadata keyed by renderer type.
 * Drives the type-picker buttons and the preview label.
 */
export const RENDERER_TYPE_OPTION_MAP: Record<VideoRendererType, RendererTypeOption> = {
    [VideoRendererType.MpegDash]: {
        type: VideoRendererType.MpegDash,
        label: "MPEG-DASH",
        description: "dashjs adaptive streaming (.mpd)",
        color: "from-emerald-600 to-teal-600",
        icon: <BroadcastIcon className="size-5" aria-hidden="true" focusable="false" />,
    },
    [VideoRendererType.Standard]: {
        type: VideoRendererType.Standard,
        label: "Standard",
        description: "Native <video> (mp4, webm)",
        color: "from-indigo-600 to-purple-600",
        icon: <PlayIcon className="size-5" aria-hidden="true" focusable="false" />,
    },
    [VideoRendererType.Youtube]: {
        type: VideoRendererType.Youtube,
        label: "YouTube",
        description: "Iframe embed",
        color: "from-red-600 to-rose-600",
        icon: <PlayIcon className="size-5" aria-hidden="true" focusable="false" />,
    },
}

/**
 * Ordered renderer-type options for the selector.
 * Order matches the original layout: MPEG-DASH, Standard, YouTube.
 */
export const RENDERER_TYPE_OPTIONS: Array<RendererTypeOption> = [
    RENDERER_TYPE_OPTION_MAP[VideoRendererType.MpegDash],
    RENDERER_TYPE_OPTION_MAP[VideoRendererType.Standard],
    RENDERER_TYPE_OPTION_MAP[VideoRendererType.Youtube],
]
