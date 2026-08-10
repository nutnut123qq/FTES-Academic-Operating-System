"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
    Button,
    CloseButton,
    Drawer,
    Popover,
    PopoverContent,
    Typography,
    cn,
} from "@heroui/react"
import { ArrowsInIcon, ArrowsOutIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { FloatingActionButton } from "@/components/blocks/buttons/FloatingActionButton"
import { useContentAiChatOverlayState } from "@/hooks/zustand/overlay/hooks"
import { ContentAiChat } from "@/components/features/learn/ContentAiChat"
import { useFullscreenElement } from "@/components/features/learn/LessonReader/hooks/useFullscreen"

/** localStorage key for the FAB's persisted vertical position (px from viewport bottom). */
const STORAGE_KEY = "contentAiFabBottom"
/** Default distance from the viewport bottom (px). */
const DEFAULT_BOTTOM = 96
/** Lowest the FAB may sit (px from bottom) — keeps it clear of the very edge. */
const MIN_BOTTOM = 16
/** Pixels the pointer must travel before a press counts as a drag (not a click). */
const DRAG_THRESHOLD = 6
/** Headroom kept below the top edge so the FAB never drags off-screen (px). */
const TOP_GUARD = 80

/**
 * Nền SÁNG + ring accent thay cho nền accent đặc: linh vật cáo cũng tông hồng-cam,
 * đặt trên nền accent thì chìm hẳn. Toàn token của hệ nên chạy đúng cả dark mode.
 * (`bg-*` ở layer utilities nên đè được `--button-bg` của variant HeroUI.)
 */
const FAB_SURFACE_CLASS = "bg-surface ring-1 ring-accent/40 hover:bg-default"

/**
 * Viền "LED chạy" — vòng conic-gradient NHIỀU MÀU phủ TRỌN vòng, mask chừa vành → giữa TRONG
 * SUỐT (KHÔNG che mascot), animate góc conic → màu CHẠY quanh viền. Định nghĩa ở `globals.css`
 * (`.ai-fab-led-ring`, mirror `.rainbow-border-4side` FTES cũ) bằng CSS THẬT — mask/
 * mask-composite viết bằng Tailwind arbitrary KHÔNG đáng tin (bản trước phủ đặc che mất mascot).
 * Nút đã `fixed` nên `::before absolute` neo thẳng vào, KHÔNG cần `relative` (thêm sẽ đè `fixed`
 * → nút biến mất).
 */
const FAB_LED_CLASS = "ai-fab-led-ring"

/** Mặt cáo FTES trong nút nổi — ảnh trang trí, tên cho screen-reader nằm ở `aria-label` của nút. */
const MascotFace = () => (
    <Image
        src="/mascot/plain/greeting.webp"
        alt=""
        aria-hidden
        width={72}
        height={72}
        className="size-9 shrink-0 object-contain"
    />
)

/**
 * Floating "Ask FTES AI" button (StarCI port). Shown only while a lesson is open
 * (a `contentId` route param). Desktop: the FAB anchors the AI chat in a Popover
 * beside the bubble and can be dragged VERTICALLY to park it out of the way of the
 * reading column / composer / pager (position persisted in localStorage). Mobile:
 * it opens the chat in a bottom-sheet Drawer (a popover is too cramped on a phone).
 *
 * Open state lives in the shared overlay store (`contentAiChat` key); the thread +
 * composer are rendered by {@link ContentAiChat}. Mounted once by the learn layout
 * alongside {@link import("../LessonReader/ContentAiSelectionAsk").ContentAiSelectionAsk}.
 */
export const ContentAiFab = () => {
    const t = useTranslations("learn")
    const { contentId } = useParams<{ contentId?: string }>()
    const { isOpen, setOpen, open } = useContentAiChatOverlayState()
    const { isMobile } = useSmViewpoint()
    // "Mở rộng": grow the chat to a full-screen popup (desktop) / full-height sheet (mobile).
    // Kept as local host state so ContentAiChat stays ONE mounted instance whose container
    // merely resizes — toggling this never remounts the thread (the conversation is in-memory).
    const [isExpanded, setIsExpanded] = useState(false)
    // Collapsing back to docked whenever the panel closes, so re-opening starts compact.
    const closeChat = useCallback(() => {
        setIsExpanded(false)
        setOpen(false)
    }, [setOpen])
    // When a video wrapper is fullscreen, the browser paints it in a top layer above
    // everything, so a fixed FAB in <body> is hidden. Portal the whole FAB (and route
    // its popover/drawer overlay) INTO the fullscreen element so it stays usable.
    const fullscreenEl = useFullscreenElement()

    // vertical position of the FAB (px from viewport bottom); restored from localStorage on mount
    const [bottom, setBottom] = useState<number>(DEFAULT_BOTTOM)
    useEffect(() => {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved !== null && !Number.isNaN(Number(saved))) {
            setBottom(Number(saved))
        }
    }, [])

    // drag bookkeeping: a press opens the popover ONLY when it did not become a drag
    const draggingRef = useRef(false)
    const startRef = useRef<{ pointerY: number; bottom: number } | null>(null)

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            startRef.current = { pointerY: event.clientY, bottom }
            draggingRef.current = false
            event.currentTarget.setPointerCapture?.(event.pointerId)
        },
        [bottom],
    )

    const onPointerMove = useCallback((event: React.PointerEvent) => {
        const start = startRef.current
        if (!start) {
            return
        }
        // dragging UP (smaller clientY) should RAISE the bubble → larger `bottom`
        const delta = start.pointerY - event.clientY
        if (Math.abs(delta) > DRAG_THRESHOLD) {
            draggingRef.current = true
        }
        const maxBottom = window.innerHeight - TOP_GUARD
        setBottom(Math.min(Math.max(start.bottom + delta, MIN_BOTTOM), maxBottom))
    }, [])

    const onPointerUp = useCallback(
        (event: React.PointerEvent) => {
            if (startRef.current && draggingRef.current) {
                window.localStorage.setItem(STORAGE_KEY, String(bottom))
            }
            startRef.current = null
            event.currentTarget.releasePointerCapture?.(event.pointerId)
        },
        [bottom],
    )

    // swallow the popover toggle that React Aria fires at the END of a drag-release
    const onOpenChange = useCallback(
        (next: boolean) => {
            if (draggingRef.current) {
                draggingRef.current = false
                return
            }
            if (!next) {
                setIsExpanded(false)
            }
            setOpen(next)
        },
        [setOpen],
    )

    // the FAB is only meaningful while a lesson is open
    if (!contentId) {
        return null
    }

    // A fullscreen video wrapper is painted in the browser top layer; portal the FAB
    // into it (and target its overlay there) so it renders ABOVE the video.
    const intoFullscreen = (tree: React.ReactNode): React.ReactNode =>
        fullscreenEl ? createPortal(tree, fullscreenEl) : tree

    // MOBILE — a fixed FAB that opens the bottom-sheet drawer
    if (isMobile) {
        return intoFullscreen(
            <>
                <FloatingActionButton
                    onPress={open}
                    ariaLabel={t("reader.ai.open")}
                    className={cn(FAB_SURFACE_CLASS, FAB_LED_CLASS)}
                >
                    <MascotFace />
                </FloatingActionButton>
                <Drawer.Backdrop
                    isOpen={isOpen}
                    onOpenChange={(next) => {
                        if (!next) {
                            setIsExpanded(false)
                        }
                        setOpen(next)
                    }}
                    UNSTABLE_portalContainer={fullscreenEl ?? undefined}
                >
                    <Drawer.Content placement="bottom">
                        <Drawer.Dialog className={cn("flex flex-col", isExpanded ? "h-[100dvh]" : "h-[80vh]")}>
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <div className="flex items-center gap-2">
                                    <Drawer.Heading>{t("reader.ai.title")}</Drawer.Heading>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="tertiary"
                                        aria-label={t(isExpanded ? "reader.ai.collapse" : "reader.ai.expand")}
                                        onPress={() => setIsExpanded((prev) => !prev)}
                                    >
                                        {isExpanded ? (
                                            <ArrowsInIcon aria-hidden focusable="false" className="size-5" />
                                        ) : (
                                            <ArrowsOutIcon aria-hidden focusable="false" className="size-5" />
                                        )}
                                    </Button>
                                </div>
                            </Drawer.Header>
                            <Drawer.Body className="min-h-0 flex-1 pb-6">
                                <ContentAiChat expanded={isExpanded} />
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </>,
        )
    }

    // DESKTOP — draggable right-edge FAB anchoring the chat popover
    return intoFullscreen(
        <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button
                isIconOnly
                variant="primary"
                aria-label={t("reader.ai.open")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ bottom }}
                className={cn(
                    "fixed right-6 z-40 !size-14 touch-none rounded-full shadow-lg",
                    FAB_SURFACE_CLASS,
                    FAB_LED_CLASS,
                )}
            >
                <MascotFace />
            </Button>
            <PopoverContent
                placement="left bottom"
                // Expanded: strip the popover card chrome — the inner panel below goes
                // `fixed inset-0` (react-aria positions the popover with top/left, NOT a
                // transform, so a fixed descendant escapes to the real viewport) and covers
                // the whole card, so no 380px box peeks behind the full-screen surface.
                className={cn("p-0", isExpanded ? "!w-auto !border-0 !bg-transparent !shadow-none" : "w-[380px]")}
                UNSTABLE_portalContainer={fullscreenEl ?? undefined}
            >
                {/* ONE wrapper that merely RESIZES between docked (in-popover, 380px) and
                    expanded (full-screen). ContentAiChat stays the same mounted instance either
                    way, so "mở rộng" never resets the in-memory conversation. */}
                <div
                    className={cn(
                        "flex flex-col bg-surface",
                        isExpanded ? "fixed inset-0 z-[60] h-[100dvh] w-screen" : "w-[380px]",
                    )}
                >
                    <div className="flex items-center gap-2 p-3">
                        <SparkleIcon aria-hidden focusable="false" weight="fill" className="size-5 shrink-0 text-accent" />
                        <Typography type="body" weight="semibold" className="min-w-0 flex-1 truncate">
                            {t("reader.ai.title")}
                        </Typography>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            aria-label={t(isExpanded ? "reader.ai.collapse" : "reader.ai.expand")}
                            onPress={() => setIsExpanded((prev) => !prev)}
                        >
                            {isExpanded ? (
                                <ArrowsInIcon aria-hidden focusable="false" className="size-5" />
                            ) : (
                                <ArrowsOutIcon aria-hidden focusable="false" className="size-5" />
                            )}
                        </Button>
                        {/* A full-screen surface has no "outside" to dismiss on, so give it an
                            explicit close; the docked popover keeps click-outside dismissal. */}
                        {isExpanded ? (
                            <CloseButton aria-label={t("reader.ai.close")} onPress={closeChat} />
                        ) : null}
                    </div>
                    {/* ONE body div at a STABLE tree position — only its classes + the chat's
                        props change between modes, so ContentAiChat is never remounted (its
                        in-memory thread survives expand/collapse). Expanded: fill + centre the
                        column; docked: the original compact padding. */}
                    <div className={isExpanded ? "flex min-h-0 flex-1 flex-col px-4 pb-4" : "p-3 pt-0"}>
                        <ContentAiChat
                            expanded={isExpanded}
                            className={isExpanded ? "mx-auto w-full max-w-3xl" : undefined}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>,
    )
}

export default ContentAiFab
