"use client"

import React, { useCallback, useState } from "react"
import { cn } from "@heroui/react"
import { AdminMpegDashTestHeader } from "./Header"
import { ConfigCard } from "./ConfigCard"
import { PreviewCard } from "./PreviewCard"
import { QuickTestUrls } from "./QuickTestUrls"
import type { QuickTestUrl } from "./types"
import { VideoRendererType } from "@/modules/types/enums/video-renderer-type"
import { type WithClassNames } from "@/modules/types/base/class-name"

/**
 * Admin tool page for testing the VideoRenderer with all 3 renderer types.
 * Owns the URL + active-type state and action handlers; renders presentational cards.
 * Enter a URL and pick Standard / MpegDash / Youtube to preview.
 */
export const AdminMpegDashTest = ({ className }: WithClassNames<undefined>) => {
    const [url, setUrl] = useState("")
    const [activeType, setActiveType] = useState<VideoRendererType>(
        VideoRendererType.MpegDash,
    )

    const onChangeUrl = useCallback(
        (value: string) => setUrl(value),
        [],
    )

    const onSelectType = useCallback(
        (type: VideoRendererType) => setActiveType(type),
        [],
    )

    /** Load a preset: set both its URL and renderer type. */
    const onSelectQuickTestUrl = useCallback(
        (item: QuickTestUrl) => {
            setUrl(item.url)
            setActiveType(item.type)
        },
        [],
    )

    return (
        <div className={cn("min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 md:p-8", className)}>
            <div className="mx-auto max-w-4xl space-y-6">
                <AdminMpegDashTestHeader />

                <ConfigCard
                    url={url}
                    activeType={activeType}
                    onChangeUrl={onChangeUrl}
                    onSelectType={onSelectType}
                />

                <PreviewCard
                    url={url}
                    activeType={activeType}
                />

                <QuickTestUrls onSelect={onSelectQuickTestUrl} />
            </div>
        </div>
    )
}
