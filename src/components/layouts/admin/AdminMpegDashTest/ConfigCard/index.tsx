"use client"

import React from "react"
import { Card, Input, cn } from "@heroui/react"
import { RENDERER_TYPE_OPTIONS } from "../map"
import { RendererTypeButton } from "./RendererTypeButton"
import type { VideoRendererType } from "@/modules/types/enums/video-renderer-type"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface ConfigCardProps extends WithClassNames<undefined> {
    /** Current URL value. */
    url: string
    /** Currently selected renderer type. */
    activeType: VideoRendererType
    /** Updates the URL value. */
    onChangeUrl: (value: string) => void
    /** Selects a renderer type. */
    onSelectType: (type: VideoRendererType) => void
}

/**
 * Configuration card: URL input + renderer-type selector buttons.
 * @param props.url - Current URL value.
 * @param props.activeType - Currently selected renderer type.
 * @param props.onChangeUrl - Updates the URL value.
 * @param props.onSelectType - Selects a renderer type.
 */
export const ConfigCard = ({
    url,
    activeType,
    onChangeUrl,
    onSelectType,
    className,
}: ConfigCardProps) => (
    <Card className={cn("border border-white/10 bg-white/5 backdrop-blur-xl", className)}>
        <Card.Content className="flex flex-col gap-3 p-6">
            <h2 className="text-lg font-semibold text-white">
                Configuration
            </h2>

            <Input
                id="mpegdash-url-input"
                placeholder="https://example.com/stream/manifest.mpd"
                value={url}
                onChange={(e) => onChangeUrl(e.target.value)}
                className="text-white"
            />

            <div className="flex flex-wrap gap-2">
                {RENDERER_TYPE_OPTIONS.map((option) => (
                    <RendererTypeButton
                        key={option.type}
                        option={option}
                        isActive={activeType === option.type}
                        onSelect={onSelectType}
                    />
                ))}
            </div>
        </Card.Content>
    </Card>
)
