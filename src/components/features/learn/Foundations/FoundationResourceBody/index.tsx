"use client"

import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import { Button, Card, CardContent, cn } from "@heroui/react"
import React from "react"
import { VideoRenderer } from "@/components/reuseable/VideoRenderer"
import { resolveFoundationMountFileUrl } from "../utils"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { FoundationKind } from "@/modules/types/enums/foundation-kind"
import { VideoHostPlatform } from "@/modules/types/enums/video-host-platform"
import type { FoundationEntity } from "@/modules/types/entities/foundation"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FoundationResourceBody}. */
export interface FoundationResourceBodyProps extends WithClassNames<undefined> {
    /** Foundation resource to render. */
    foundation: FoundationEntity
}

/**
 * Renders a foundation resource body by its kind — markdown article
 * ({@link MarkdownContent}) or embedded video ({@link VideoRenderer}). Used by the
 * dedicated resource page (the former modal viewer, now a full page). External
 * links normally open in a new tab on click and never reach this page; when one is
 * deep-linked directly it falls back to an "open link" button.
 * @param props.foundation - The resource entity (kind + `value`).
 * @param props.className - Optional root class names.
 */
export const FoundationResourceBody = ({
    foundation,
    className,
}: FoundationResourceBodyProps) => {
    switch (foundation.kind) {
    case FoundationKind.Document:
        // reading article sits in a "paper" Card like the lesson reader's ContentBody
        // (not flat on the canvas) — markdown is the reading content, the card is its surface.
        return (
            <Card className={className}>
                <CardContent>
                    <MarkdownContent markdown={foundation.value ?? ""} />
                </CardContent>
            </Card>
        )
    case FoundationKind.Video: {
        const rawValue = foundation.value ?? ""
        const isYoutube = /youtube\.com|youtu\.be/i.test(rawValue)
        // resolve mount-relative values to a full URL; VideoRenderer picks the
        // player from the URL (.mpd → DASH, mp4 → Standard)
        const url = resolveFoundationMountFileUrl(rawValue)
        return (
            <div className={cn("w-full", className)}>
                <VideoRenderer
                    classNames={{
                        base: "w-full overflow-hidden rounded-lg",
                        content: "w-full",
                    }}
                    url={url}
                    hostPlatform={isYoutube ? VideoHostPlatform.Youtube : undefined}
                    title={foundation.title}
                />
            </div>
        )
    }
    case FoundationKind.ExternalLink:
        if (!foundation.value?.trim()) {
            return null
        }
        return (
            <Button
                variant="primary"
                className={cn("self-start", className)}
                onPress={() => window.open(
                    resolveFoundationMountFileUrl(foundation.value ?? ""),
                    "_blank",
                    "noopener,noreferrer",
                )}
            >
                <ArrowSquareOutIcon aria-hidden focusable="false" className="size-5" />
                {foundation.title}
            </Button>
        )
    default:
        return null
    }
}
