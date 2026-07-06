"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@heroui/react"
import { SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useContentAiChatOverlayState, useContentAiSelection } from "@/hooks/zustand/overlay/hooks"

/** Screen position + text of an active passage selection. */
interface Anchor {
    x: number
    y: number
    text: string
    /** Containing paragraph — hidden grounding for the AI. */
    context: string
}

/** Minimum selected characters before the button appears. */
const MIN_CHARS = 4
/** Cap the passage we anchor on (long selections stay readable in the banner). */
const MAX_CHARS = 600

/**
 * Selection-anchored "Ask AI about this" entry (rule
 * ai-selection-anchored-ask-passage). Listens to text selections INSIDE
 * `#lesson-article` only; on a valid selection it portals a floating button at
 * the top of the selection rect. Pressing it stashes the passage (+ its
 * paragraph as hidden context) in the overlay store and opens the AI chat panel.
 *
 * `onMouseDown preventDefault` keeps the selection alive until the click fires.
 * The button hides on collapse / scroll / resize. Premium bodies use
 * `select-none`, so no button ever appears on gated content.
 */
export const ContentAiSelectionAsk = () => {
    const t = useTranslations("learn")
    const [anchor, setAnchor] = useState<Anchor | null>(null)
    const { setSelection } = useContentAiSelection()
    const { open } = useContentAiChatOverlayState()

    useEffect(() => {
        const article = () => document.getElementById("lesson-article")

        const readSelection = () => {
            const selection = window.getSelection()
            if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
                setAnchor(null)
                return
            }
            const range = selection.getRangeAt(0)
            const root = article()
            if (!root || !root.contains(range.commonAncestorContainer)) {
                setAnchor(null)
                return
            }
            const text = selection.toString().trim()
            if (text.length < MIN_CHARS) {
                setAnchor(null)
                return
            }
            const rect = range.getBoundingClientRect()
            if (rect.width === 0 && rect.height === 0) {
                setAnchor(null)
                return
            }
            // The containing block's text = grounding context for the model.
            const container =
                range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                    ? (range.commonAncestorContainer as Element)
                    : range.commonAncestorContainer.parentElement
            setAnchor({
                x: rect.left + rect.width / 2,
                y: rect.top,
                text: text.slice(0, MAX_CHARS),
                context: container?.textContent?.trim().slice(0, MAX_CHARS) ?? text,
            })
        }

        const onSelectionChange = () => {
            const selection = window.getSelection()
            if (!selection || selection.isCollapsed) {
                setAnchor(null)
            }
        }
        const clear = () => setAnchor(null)

        document.addEventListener("mouseup", readSelection)
        document.addEventListener("touchend", readSelection)
        document.addEventListener("selectionchange", onSelectionChange)
        window.addEventListener("scroll", clear, true)
        window.addEventListener("resize", clear)
        return () => {
            document.removeEventListener("mouseup", readSelection)
            document.removeEventListener("touchend", readSelection)
            document.removeEventListener("selectionchange", onSelectionChange)
            window.removeEventListener("scroll", clear, true)
            window.removeEventListener("resize", clear)
        }
    }, [])

    if (!anchor || typeof document === "undefined") {
        return null
    }

    const onAsk = () => {
        setSelection(anchor.text, anchor.context)
        open()
        window.getSelection()?.removeAllRanges()
        setAnchor(null)
    }

    return createPortal(
        <div
            style={{ position: "fixed", top: anchor.y - 44, left: anchor.x, transform: "translateX(-50%)", zIndex: 45 }}
            // keep the selection alive through the click
            onMouseDown={(event) => event.preventDefault()}
        >
            <Button size="sm" variant="primary" onPress={onAsk}>
                <SparkleIcon aria-hidden focusable="false" weight="fill" className="size-4" />
                {t("reader.askAboutThis")}
            </Button>
        </div>,
        document.body,
    )
}
