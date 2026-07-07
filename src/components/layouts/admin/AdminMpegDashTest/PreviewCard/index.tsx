"use client"

import React from "react"
import { Card, cn } from "@heroui/react"
import { useMemo } from "react"
import { RENDERER_TYPE_OPTION_MAP } from "../map"
import { VideoRenderer } from "@/components/reuseable/VideoRenderer"
import type { VideoRendererType } from "@/modules/types/enums/video-renderer-type"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface PreviewCardProps extends WithClassNames<undefined> {
    /** URL to preview. */
    url: string
    /** Renderer type used to preview the URL. */
    activeType: VideoRendererType
}

/**
 * Preview card: renders the {@link VideoRenderer} for the entered URL,
 * or a placeholder when no URL is provided.
 * @param props.url - URL to preview.
 * @param props.activeType - Renderer type used to preview the URL.
 */
export const PreviewCard = ({ url, activeType, className }: PreviewCardProps) => {
    const activeLabel = useMemo(
        () => RENDERER_TYPE_OPTION_MAP[activeType]?.label,
        [activeType],
    )
    const hasUrl = url.trim().length > 0

    return (
        <Card className={cn("border border-white/10 bg-white/5 backdrop-blur-xl", className)}>
            <Card.Content className="flex flex-col gap-3 p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    Preview
                    <span className="text-xs font-normal text-slate-400">
                        ({activeLabel})
                    </span>
                </h2>

                {hasUrl ? (
                    <VideoRenderer
                        url={url}
                        rendererType={activeType}
                        title="Test video"
                    />
                ) : (
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-slate-500">
                        Enter a URL above to preview
                    </div>
                )}
            </Card.Content>
        </Card>
    )
}
