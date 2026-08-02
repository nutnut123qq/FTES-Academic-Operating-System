"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
    Button,
    Drawer,
    Popover,
    PopoverContent,
    Typography,
    cn,
} from "@heroui/react"
import { SparkleIcon } from "@phosphor-icons/react"
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
 * Viền "LED chạy" — một vòng conic-gradient NHIỀU MÀU phủ TRỌN vòng (không có khoảng trong
 * suốt) quay quanh mép nút → các màu CHẠY vòng theo viền (đèn LED chạy), KHÔNG phải một vệt
 * sáng quét. Palette mirror nút hỏi-đáp AI FTES cũ (`.rainbow-border-4side`). Dựng bằng
 * pseudo-`::before` full-size, tô conic-gradient rồi MASK content-box + exclude để CHỈ chừa
 * vành `p-[3px]` (giữa trong suốt → không che linh vật), `animate-spin` cho vòng màu chạy.
 * `motion-safe:` tôn trọng "giảm chuyển động"; `pointer-events-none` để không chặn click.
 *
 * ⚠️ KHÔNG thêm `relative` ở đây: nút mang class này vốn đã `fixed` (desktop) / `fixed`
 * (FloatingActionButton mobile) → đã là positioning-context cho `::before absolute`. Nếu
 * thêm `relative`, Tailwind sinh `.relative` SAU `.fixed` nên nó ĐÈ `fixed` → nút rơi khỏi
 * góc (biến mất). Pseudo neo thẳng vào nút `fixed`, không cần `relative`.
 */
const FAB_LED_CLASS = cn(
    "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
    "before:rounded-full before:p-[3px]",
    "before:[background:conic-gradient(from_0deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#9b59b6,#ff6b9d,#ff6b6b)]",
    "before:[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]",
    "before:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]",
    "before:[mask-composite:exclude] before:[-webkit-mask-composite:xor]",
    "before:motion-safe:animate-[spin_3s_linear_infinite]",
)

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
                    onOpenChange={setOpen}
                    UNSTABLE_portalContainer={fullscreenEl ?? undefined}
                >
                    <Drawer.Content placement="bottom">
                        <Drawer.Dialog className="flex h-[80vh] flex-col">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>{t("reader.ai.title")}</Drawer.Heading>
                            </Drawer.Header>
                            <Drawer.Body className="min-h-0 flex-1 pb-6">
                                <ContentAiChat />
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
                className="w-[380px] p-0"
                UNSTABLE_portalContainer={fullscreenEl ?? undefined}
            >
                <div className="flex items-center gap-2 p-3">
                    <SparkleIcon aria-hidden focusable="false" weight="fill" className="size-5 text-accent" />
                    <Typography type="body" weight="semibold">
                        {t("reader.ai.title")}
                    </Typography>
                </div>
                <div className="p-3 pt-0">
                    <ContentAiChat />
                </div>
            </PopoverContent>
        </Popover>,
    )
}

export default ContentAiFab
