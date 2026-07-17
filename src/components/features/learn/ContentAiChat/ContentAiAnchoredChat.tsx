"use client"

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CloseButton, Typography } from "@heroui/react"
import { SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useContentAiAnchoredPanel, useContentAiSelection } from "@/hooks/zustand/overlay/hooks"
import type { AnchorRect } from "@/hooks/zustand/overlay/store"
import { ContentAiChat } from "@/components/features/learn/ContentAiChat"

/** Panel width (px) — a comfortable reading column beside the passage. */
const PANEL_WIDTH = 360
/** Gap between the selection rect and the panel (px). */
const GAP = 12
/** Minimum breathing room to the viewport edges (px). */
const MARGIN = 8

/** Resolved panel placement (fixed-position, viewport coordinates). */
interface Position {
    left: number
    top: number
    maxHeight: number
}

/**
 * Place the panel next to the selection rect: preferred to the RIGHT of the rect,
 * flipping LEFT when the right edge would overflow, falling UNDER the rect (centered)
 * when neither side fits. Top is clamped so the panel always sits inside the viewport.
 */
const computePosition = (rect: AnchorRect, panelHeight: number, vw: number, vh: number): Position => {
    const maxHeight = Math.min(vh * 0.7, vh - MARGIN * 2)
    const height = Math.min(panelHeight || maxHeight, maxHeight)

    const rightEdge = rect.right + GAP + PANEL_WIDTH
    const leftStart = rect.left - GAP - PANEL_WIDTH

    let left: number
    let top: number
    if (rightEdge <= vw - MARGIN) {
        // fits to the right
        left = rect.right + GAP
        top = rect.top
    } else if (leftStart >= MARGIN) {
        // flip to the left
        left = leftStart
        top = rect.top
    } else {
        // both sides overflow → under the rect, horizontally centered
        left = rect.left + rect.width / 2 - PANEL_WIDTH / 2
        top = rect.bottom + GAP
    }

    left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, vw - PANEL_WIDTH - MARGIN))
    top = Math.min(Math.max(top, MARGIN), Math.max(MARGIN, vh - height - MARGIN))
    return { left, top, maxHeight }
}

/**
 * Desktop selection-anchored AI chat panel (rule ai-selection-anchored-panel).
 * A fixed-position portal panel placed next to the highlighted passage (right →
 * flip left → under, clamped inside the viewport), rendering the same
 * {@link ContentAiChat} body as the FAB popover. Opened by
 * {@link import("../LessonReader/ContentAiSelectionAsk").ContentAiSelectionAsk} on
 * desktop only — mobile keeps the FAB bottom-sheet. Mounted once by the learn layout.
 *
 * Dismissal: Escape, pointer-down outside the panel (ignoring the model dropdown's
 * portaled menu), and a REAL lesson change (prev-ref — never on mount, so the
 * just-stored selection intent survives the panel opening). Every dismissal clears
 * the stored passage selection.
 */
export const ContentAiAnchoredChat = () => {
    const t = useTranslations("learn")
    const { isOpen, close, anchorRect } = useContentAiAnchoredPanel()
    const { setSelection } = useContentAiSelection()
    const { contentId } = useParams<{ contentId?: string }>()
    const panelRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<Position | null>(null)

    /** Close the panel AND clear the passage selection (single dismissal path). */
    const dismiss = useCallback(() => {
        close()
        setSelection(null)
    }, [close, setSelection])

    // Measure the panel once open (its height depends on content) and place it;
    // recompute on viewport resize. Runs BEFORE paint so there is no flash.
    useLayoutEffect(() => {
        if (!isOpen || !anchorRect) {
            setPosition(null)
            return
        }
        const measure = () => {
            const height = panelRef.current?.offsetHeight ?? 0
            setPosition(computePosition(anchorRect, height, window.innerWidth, window.innerHeight))
        }
        measure()
        window.addEventListener("resize", measure)
        return () => window.removeEventListener("resize", measure)
    }, [isOpen, anchorRect])

    // Escape + pointer-down outside → dismiss. The model picker renders its menu in
    // a react-aria portal (outside the panel), so clicks landing in a dropdown/menu/
    // dialog popover are NOT "outside" and must not close the panel.
    useEffect(() => {
        if (!isOpen) {
            return
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                dismiss()
            }
        }
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null
            if (!target) {
                return
            }
            if (panelRef.current?.contains(target)) {
                return
            }
            if (target.closest?.("[data-slot='dropdown-popover'],[role='menu'],[role='listbox'],[role='dialog']")) {
                return
            }
            dismiss()
        }
        document.addEventListener("keydown", onKeyDown)
        document.addEventListener("pointerdown", onPointerDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.removeEventListener("pointerdown", onPointerDown)
        }
    }, [isOpen, dismiss])

    // Close on a REAL lesson change only (track the previous contentId). Never on
    // mount: the selection intent is stored right BEFORE this panel opens, so a
    // reset-on-mount would eat it (rule ai-selection-anchored-ask-passage).
    const prevContentIdRef = useRef<string | undefined>(undefined)
    useEffect(() => {
        const prev = prevContentIdRef.current
        prevContentIdRef.current = contentId
        if (isOpen && prev !== undefined && prev !== contentId) {
            dismiss()
        }
    }, [contentId, isOpen, dismiss])

    if (!isOpen || !anchorRect || typeof document === "undefined") {
        return null
    }

    return createPortal(
        <div
            ref={panelRef}
            role="dialog"
            aria-label={t("reader.ai.title")}
            style={{
                position: "fixed",
                width: PANEL_WIDTH,
                left: position?.left ?? 0,
                top: position?.top ?? 0,
                maxHeight: position?.maxHeight,
                visibility: position ? "visible" : "hidden",
                zIndex: 50,
            }}
            className="flex flex-col overflow-hidden rounded-2xl border border-default bg-surface shadow-xl"
        >
            <div className="flex items-center gap-2 border-b border-default p-3">
                <SparkleIcon aria-hidden focusable="false" weight="fill" className="size-5 text-accent" />
                <Typography type="body" weight="semibold" className="min-w-0 flex-1 truncate">
                    {t("reader.ai.title")}
                </Typography>
                <CloseButton
                    aria-label={t("reader.ai.close")}
                    className="shrink-0 text-muted hover:bg-default"
                    onPress={dismiss}
                />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
                <ContentAiChat />
            </div>
        </div>,
        document.body,
    )
}

export default ContentAiAnchoredChat
