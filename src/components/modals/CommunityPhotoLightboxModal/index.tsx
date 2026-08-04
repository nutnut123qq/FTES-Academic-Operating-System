"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Modal, Spinner } from "@heroui/react"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useCommunityPhotoOverlayState } from "@/hooks/zustand/overlay/hooks"
import { CommunityPostContent } from "@/components/features/community/CommunityPostDetail/CommunityPostContent"

/**
 * CommunityPhotoLightboxModal — the Facebook-style photo viewer opened by
 * clicking a post image in `PostMediaGrid`. Two panes: the LEFT one letterboxes
 * the current image on black with prev/next navigation + an "n/total" counter;
 * the RIGHT one renders the full post (title + body) and its live comment thread
 * via the shared {@link CommunityPostContent} (same engagement / comment wiring
 * as the detail page). On mobile the panes stack (image on top, post below) and
 * the whole dialog scrolls; on `lg:` they split and the post pane scrolls on its
 * own while the image pane stays fixed.
 *
 * Mounted once in `ModalContainer`, controlled by the `communityPhoto` overlay
 * key. Backdrop click + Esc close it (HeroUI default via `onOpenChange`);
 * ArrowLeft / ArrowRight page through the images while it is open.
 */
export const CommunityPhotoLightboxModal = () => {
    const t = useTranslations("communityHub")
    const { isOpen, close, context } = useCommunityPhotoOverlayState()
    const [index, setIndex] = useState(0)

    // The lightbox only ever shows images; the payload may carry other media kinds.
    const images = useMemo(
        () => (context?.media ?? []).filter((item) => item.mediaType === "IMAGE"),
        [context],
    )

    // Reset to the clicked image whenever a new payload arrives (every `open` call
    // stashes a fresh context object, so this fires on each open — even for the
    // same post/index — without a stale index leaking across openings).
    useEffect(() => {
        if (context) {
            setIndex(context.startIndex)
        }
    }, [context])

    const clampedIndex =
        images.length > 0 ? Math.min(Math.max(index, 0), images.length - 1) : 0
    const current = images[clampedIndex]
    const hasMultiple = images.length > 1

    const goPrev = useCallback(() => {
        setIndex((value) => Math.max(0, value - 1))
    }, [])

    const goNext = useCallback(() => {
        setIndex((value) => Math.min(images.length - 1, value + 1))
    }, [images.length])

    // Arrow keys page the gallery — but never while the viewer is typing in the
    // comment composer (an editable target keeps its own caret movement).
    useEffect(() => {
        if (!isOpen) {
            return
        }
        const onKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            if (
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable)
            ) {
                return
            }
            if (event.key === "ArrowLeft") {
                goPrev()
            } else if (event.key === "ArrowRight") {
                goNext()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isOpen, goPrev, goNext])

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    close()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container className="p-3 sm:p-6">
                    <Modal.Dialog className="h-[90vh] max-h-[90vh] w-[95vw] max-w-6xl overflow-hidden p-0">
                        <Modal.CloseTrigger aria-label={t("photoViewer.close")} className="z-20" />
                        {context && current ? (
                            <div className="flex h-full flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden">
                                {/* LEFT — the image, letterboxed on black */}
                                <div className="relative flex aspect-video max-h-[50vh] shrink-0 items-center justify-center bg-black lg:aspect-auto lg:h-full lg:max-h-none">
                                    <img
                                        key={current.id}
                                        src={current.storageKey}
                                        alt={t("composer.imageAlt")}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                    {hasMultiple ? (
                                        <>
                                            <Button
                                                isIconOnly
                                                variant="ghost"
                                                aria-label={t("photoViewer.previous")}
                                                isDisabled={clampedIndex === 0}
                                                onPress={goPrev}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                                            >
                                                <CaretLeftIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="size-6"
                                                />
                                            </Button>
                                            <Button
                                                isIconOnly
                                                variant="ghost"
                                                aria-label={t("photoViewer.next")}
                                                isDisabled={clampedIndex === images.length - 1}
                                                onPress={goNext}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                                            >
                                                <CaretRightIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="size-6"
                                                />
                                            </Button>
                                            <div
                                                aria-label={t("photoViewer.counter", {
                                                    current: clampedIndex + 1,
                                                    total: images.length,
                                                })}
                                                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
                                            >
                                                {clampedIndex + 1}/{images.length}
                                            </div>
                                        </>
                                    ) : null}
                                </div>

                                {/* RIGHT — the post + its comment thread (scrolls on its own on lg:) */}
                                <div className="flex min-h-0 flex-col bg-overlay px-4 lg:overflow-y-auto">
                                    <CommunityPostContent
                                        key={context.postId}
                                        postId={context.postId}
                                        showMedia={false}
                                        regionId={`photo-post-comments-${context.postId}`}
                                        commentsAnchorId={`photo-comments-${context.postId}`}
                                        loadingFallback={
                                            <div className="flex flex-1 items-center justify-center py-16">
                                                <Spinner aria-label={t("photoViewer.loading")} />
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        ) : null}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
