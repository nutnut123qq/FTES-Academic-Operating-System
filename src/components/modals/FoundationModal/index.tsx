"use client"

import React from "react"
import { cn, Modal, ScrollShadow } from "@heroui/react"
import { VideoRenderer } from "@/components/reuseable/VideoRenderer"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { resolveFoundationMountFileUrl } from "@/components/features/learn/Foundations/utils/resolveFoundationUrls"
import { useFoundationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { FoundationKind } from "@/modules/types/enums/foundation-kind"
import { VideoHostPlatform } from "@/modules/types/enums/video-host-platform"
import { useAppSelector } from "@/redux/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link FoundationModal}.
 */
export type FoundationModalProps = WithClassNames<undefined>

/**
 * Foundation viewer modal: renders markdown or MPEG-DASH by `foundation.kind`.
 *
 * @param props - Optional styling props.
 */
export const FoundationModal = (props: FoundationModalProps) => {
    const { className } = props
    const { isOpen, setOpen } = useFoundationOverlayState()
    const foundation = useAppSelector((state) => state.foundation.entity)

    const renderBody = () => {
        if (!foundation) {
            return null
        }

        switch (foundation.kind) {
        case FoundationKind.Document:
            return (
                <ScrollShadow hideScrollBar className="px-3">
                    <MarkdownContent markdown={foundation.value ?? ""} />
                    <div className="h-6" />
                </ScrollShadow>
            )
        case FoundationKind.Video: {
            const rawValue = foundation.value ?? ""
            const isYoutube = /youtube\.com|youtu\.be/i.test(rawValue)
            // resolve mount-relative values to a full URL; VideoRenderer then
            // auto-picks the player from the URL (.mpd → DASH, mp4 → Standard)
            const url = resolveFoundationMountFileUrl(rawValue)
            return (
                <div className="flex flex-col items-center p-4">
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
        default:
            return null
        }
    }

    const containerClassName = foundation?.kind === FoundationKind.Video
        ? "modal__container--narrow"
        : undefined

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container
                    className={containerClassName}
                    size="full"
                    scroll={foundation?.kind === FoundationKind.Document ? "inside" : undefined}
                >
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-center text-2xl font-bold">
                                {foundation?.title ?? ""}
                            </div>
                        </Modal.Header>
                        <Modal.Body>
                            {renderBody()}
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
