"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
    Button,
    Popover,
    PopoverContent,
    Typography,
    cn,
} from "@heroui/react"
import { SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { ContentAiChat } from "@/components/features/learn/ContentAiChat"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { useContentAiChatOverlayState } from "@/hooks/zustand/overlay/hooks"
import { FloatingActionButton } from "@/components/blocks/buttons/FloatingActionButton"

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

/** Props for {@link ContentAiFab}. */
export type ContentAiFabProps = WithClassNames<undefined>

/**
 * Floating "ask StarCi AI" button shown while a content is open.
 *
 * - **Desktop:** a right-edge FAB the user can drag **vertically** to park it out of
 *   the way (position persisted in localStorage); clicking it opens the AI chat in an
 *   anchored {@link Popover} beside the bubble (read the lesson + chat side by side).
 * - **Mobile:** a fixed bottom-right FAB that opens the bottom-sheet
 *   {@link import("@/components/drawers/ContentAiChatDrawer").ContentAiChatDrawer} instead
 *   (a popover is too cramped on a phone).
 *
 * Open-state lives in the shared overlay store (`contentAiChat` key); the thread +
 * composer are rendered by {@link ContentAiChat}, which reads the active content from redux.
 *
 * @param props - {@link ContentAiFabProps}
 */
export const ContentAiFab = ({ className }: ContentAiFabProps) => {
    const t = useTranslations()
    const contentId = useAppSelector((state) => state.content.id)
    const contentTitle = useAppSelector((state) => state.content.entity?.title)
    const { isOpen, setOpen, open } = useContentAiChatOverlayState()
    const { isMobile } = useSmViewpoint()

    // vertical position of the FAB (px from viewport bottom); restored from localStorage on mount
    const [bottom, setBottom] = useState<number>(DEFAULT_BOTTOM)
    useEffect(() => {
        // localStorage is client-only; read once after mount to seed the persisted position
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved !== null && !Number.isNaN(Number(saved))) {
            setBottom(Number(saved))
        }
    }, [])

    // drag bookkeeping: a press opens the popover ONLY when it did not become a drag
    const draggingRef = useRef(false)
    const startRef = useRef<{ pointerY: number; bottom: number } | null>(null)

    // remember where the drag began so we can offset from it
    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            startRef.current = { pointerY: event.clientY, bottom }
            draggingRef.current = false
            // capture so we keep getting move/up even if the pointer leaves the button
            event.currentTarget.setPointerCapture?.(event.pointerId)
        },
        [bottom],
    )

    // move the FAB up/down with the pointer, clamped to the viewport; mark it a drag past the threshold
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

    // end the gesture; persist the new position only if it was actually a drag
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

    // the FAB is only meaningful while a content is open
    if (!contentId) {
        return null
    }

    // MOBILE — fixed FAB that opens the bottom-sheet drawer (rendered by DrawerContainer)
    if (isMobile) {
        return (
            <FloatingActionButton
                onPress={open}
                ariaLabel={t("contentAi.ask")}
                className={className}
            >
                {/* sparkle = AI intent; the wrapped isIconOnly button sizes the svg */}
                <SparkleIcon />
            </FloatingActionButton>
        )
    }

    // DESKTOP — draggable right-edge FAB anchoring the chat popover
    return (
        <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button
                isIconOnly
                variant="primary"
                aria-label={t("contentAi.ask")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ bottom }}
                className={cn(
                    // keep the bubble clear of the bottom safe area (home indicator) on mobile
                    "fixed right-4 z-40 mb-[env(safe-area-inset-bottom)] touch-none rounded-full shadow-lg",
                    className,
                )}
            >
                {/* sparkle = AI intent; the isIconOnly button sizes the svg itself */}
                <SparkleIcon />
            </Button>
            <PopoverContent placement="left bottom" className="w-[380px] p-0">
                <div className="p-3">
                    <Typography type="body" className="font-medium">
                        {contentTitle ?? t("contentAi.title")}
                    </Typography>
                </div>
                <div className="p-3 pt-0">
                    <ContentAiChat />
                </div>
            </PopoverContent>
        </Popover>
    )
}
