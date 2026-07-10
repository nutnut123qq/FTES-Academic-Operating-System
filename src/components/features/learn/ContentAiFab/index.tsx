"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
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
import { useParams } from "next/navigation"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { FloatingActionButton } from "@/components/blocks/buttons/FloatingActionButton"
import { useContentAiChatOverlayState } from "@/hooks/zustand/overlay/hooks"
import { ContentAiChat } from "@/components/features/learn/ContentAiChat"

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

    // MOBILE — a fixed FAB that opens the bottom-sheet drawer
    if (isMobile) {
        return (
            <>
                <FloatingActionButton onPress={open} ariaLabel={t("reader.ai.open")}>
                    <SparkleIcon aria-hidden focusable="false" weight="fill" />
                </FloatingActionButton>
                <Drawer.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
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
            </>
        )
    }

    // DESKTOP — draggable right-edge FAB anchoring the chat popover
    return (
        <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button
                isIconOnly
                variant="primary"
                aria-label={t("reader.ai.open")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ bottom }}
                className={cn("fixed right-4 z-40 touch-none rounded-full shadow-lg")}
            >
                <SparkleIcon aria-hidden focusable="false" weight="fill" />
            </Button>
            <PopoverContent placement="left bottom" className="w-[380px] p-0">
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
        </Popover>
    )
}

export default ContentAiFab
