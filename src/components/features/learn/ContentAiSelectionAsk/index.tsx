"use client"

import React, { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@heroui/react"
import { SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import {
    useContentAiChatOverlayState,
    useContentAiSelection,
} from "@/hooks/zustand/overlay/hooks"
import { useSelectionHintStore } from "./hintStore"

/** Id of the lesson article wrapper — selection only counts inside it. */
const ARTICLE_ID = "lesson-article"
/** Ignore trivially short selections (clicks, single words barely worth asking about). */
const MIN_CHARS = 3
/** Cap the stored passage so a huge selection doesn't bloat the prompt / bubble. */
const MAX_CHARS = 600
/** Cap the surrounding-paragraph context fed to the model. */
const MAX_CONTEXT = 700

/** Block elements that count as the "containing paragraph" of a selection. */
const BLOCK_SELECTOR = "p, li, blockquote, td, th, pre, h1, h2, h3, h4, h5, h6"
/** Heading elements used to resolve the section a selection sits under. */
const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6, [data-toc-label]"

/** Floating button anchor (viewport coords) + the selected passage + its context. */
interface SelectionAnchor {
    /** Horizontal center of the selection, in viewport px. */
    x: number
    /** Top of the selection, in viewport px (the button sits above it). */
    y: number
    /** The trimmed, capped selected text. */
    text: string
    /** Hidden grounding sent to the model: the passage + its containing paragraph + section. */
    context: string
}

/** Resolve the block element (paragraph/list-item/…) containing a selection node. */
const containingBlock = (node: Node | null): Element | null => {
    const start = node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element | null)
    return start?.closest?.(BLOCK_SELECTOR) ?? null
}

/** Clean text of a heading element (prefer the anchor-free toc label). */
const headingText = (el: Element): string =>
    (el.getAttribute("data-toc-label") ?? el.textContent ?? "").trim()

/** The nearest section heading appearing BEFORE a block in the article. */
const nearestHeading = (block: Element | null, article: Element): string | null => {
    if (!block) {
        return null
    }
    let found: Element | null = null
    for (const heading of Array.from(article.querySelectorAll(HEADING_SELECTOR))) {
        // heading precedes the block → it's a candidate section for the selection
        if (heading.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) {
            found = heading
        }
    }
    return found ? headingText(found) : null
}

/** Build the hidden `<context>` grounding string from the selection + surroundings. */
const buildSelectionContext = (text: string, paragraph: string, heading: string | null): string => {
    const parts = [`Đoạn được chọn: «${text}»`]
    if (paragraph && paragraph !== text) {
        parts.push(`Nằm trong đoạn: «${paragraph}»`)
    }
    if (heading) {
        parts.push(`Thuộc mục: «${heading}»`)
    }
    return parts.join(". ")
}

/**
 * "Ask AI about this passage" floating action — the entry point for the
 * selection-anchored content-AI flow. Watches for a text selection INSIDE the
 * lesson article (`#lesson-article`); when one settles it shows a small button
 * above the highlight. Pressing it stashes the passage in the overlay store and
 * opens the ask-AI chat ({@link import("./../ContentAiChat").ContentAiChat} reads
 * the passage to scope the next question). Mounted once by the learn layout,
 * alongside {@link import("./../ContentAiFab").ContentAiFab}.
 */
export const ContentAiSelectionAsk = () => {
    const t = useTranslations()
    const { open } = useContentAiChatOverlayState()
    const { setSelection } = useContentAiSelection()
    const [anchor, setAnchor] = useState<SelectionAnchor | null>(null)
    // portal target only exists on the client
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // first-discovery flag: the button wears a "Mới" tag until the learner uses
    // it once (or dismisses the inline tip) — see hintStore / SelectionHintCallout
    const seen = useSelectionHintStore((state) => state.seen)
    const hydrate = useSelectionHintStore((state) => state.hydrate)
    const markSeen = useSelectionHintStore((state) => state.markSeen)
    useEffect(() => hydrate(), [hydrate])

    // recompute the button anchor when a selection settles inside the article
    const onSettle = useCallback(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            setAnchor(null)
            return
        }
        const article = document.getElementById(ARTICLE_ID)
        const range = selection.getRangeAt(0)
        if (!article || !article.contains(range.commonAncestorContainer)) {
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
        // capture the surrounding paragraph + section so a SHORT selection still
        // gives the model enough to reason about (sent hidden, not shown in the UI)
        const block = containingBlock(range.commonAncestorContainer)
        const paragraph = (block?.textContent ?? "").trim().slice(0, MAX_CONTEXT)
        const heading = nearestHeading(block, article)
        const cappedText = text.slice(0, MAX_CHARS)
        setAnchor({
            x: rect.left + rect.width / 2,
            y: rect.top,
            text: cappedText,
            context: buildSelectionContext(cappedText, paragraph, heading),
        })
    }, [])

    useEffect(() => {
        // show on settle (mouse/touch release); hide when the selection collapses
        // (click elsewhere) or the page scrolls (the anchor would drift)
        const onSelectionChange = () => {
            const selection = window.getSelection()
            if (!selection || selection.isCollapsed) {
                setAnchor(null)
            }
        }
        const onScroll = () => setAnchor(null)
        document.addEventListener("mouseup", onSettle)
        document.addEventListener("touchend", onSettle)
        document.addEventListener("selectionchange", onSelectionChange)
        window.addEventListener("scroll", onScroll, true)
        window.addEventListener("resize", onScroll)
        return () => {
            document.removeEventListener("mouseup", onSettle)
            document.removeEventListener("touchend", onSettle)
            document.removeEventListener("selectionchange", onSelectionChange)
            window.removeEventListener("scroll", onScroll, true)
            window.removeEventListener("resize", onScroll)
        }
    }, [onSettle])

    const onAsk = useCallback(() => {
        if (!anchor) {
            return
        }
        setSelection(anchor.text, anchor.context)
        markSeen()
        open()
        window.getSelection()?.removeAllRanges()
        setAnchor(null)
    }, [anchor, setSelection, markSeen, open])

    if (!mounted || !anchor) {
        return null
    }

    return createPortal(
        <div
            // keep the selection alive when pressing the button (mousedown would
            // otherwise collapse it before the click fires)
            onMouseDown={(event) => event.preventDefault()}
            style={{
                position: "fixed",
                left: anchor.x,
                top: Math.max(8, anchor.y - 8),
                transform: "translate(-50%, -100%)",
                zIndex: 80,
            }}
        >
            <Button size="sm" variant="primary" onPress={onAsk} className="shadow-lg">
                <SparkleIcon className="size-4" />
                {t("contentAi.askAboutSelection")}
                {!seen ? (
                    <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-medium text-accent">
                        {t("contentAi.new")}
                    </span>
                ) : null}
            </Button>
        </div>,
        document.body,
    )
}
