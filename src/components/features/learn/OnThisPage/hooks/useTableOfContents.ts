"use client"

import { useCallback, useEffect, useState } from "react"

/** A single entry in the "on this page" outline. */
export interface TocHeading {
    /** Anchor id (matches the rendered heading `id`). */
    id: string
    /** Plain-text label. */
    text: string
    /** Heading depth (2 or 3) — indents the row. */
    level: number
}

/** Result of {@link useTableOfContents}. */
export interface UseTableOfContentsResult {
    headings: Array<TocHeading>
    activeId?: string
    onJump: (id: string) => void
}

/** Id of the lesson article container the outline scans within. */
const ARTICLE_ID = "lesson-article"

/**
 * Faithful port of StarCI's `useTableOfContents`. Builds the "on this page"
 * outline by scanning the rendered article (`#lesson-article [data-toc]`) for
 * heading anchors, tracks which heading is in view (scroll-spy), and exposes a
 * smooth-scroll jump.
 *
 * DOM-driven (not data-driven) so it works for any rendered body. Observes a
 * STABLE root (`document.body`) so it reliably catches the article mounting +
 * its async render on hard reload AND SPA nav, re-scanning when `rescanKey`
 * changes (lesson navigation / language switch).
 *
 * @param rescanKey - Changes when the active lesson changes; forces a re-scan.
 */
export const useTableOfContents = (rescanKey: string | undefined): UseTableOfContentsResult => {
    const [headings, setHeadings] = useState<Array<TocHeading>>([])
    const [activeId, setActiveId] = useState<string | undefined>(undefined)

    useEffect(() => {
        let frame = 0

        const scan = () => {
            const container = document.getElementById(ARTICLE_ID)
            if (!container) {
                setHeadings([])
                return
            }
            const nodes = Array.from(container.querySelectorAll<HTMLElement>("[data-toc]"))
            const next = nodes
                .filter((node) => node.id)
                .map((node) => ({
                    id: node.id,
                    text: node.dataset.tocLabel ?? node.textContent?.trim() ?? "",
                    level: Number(node.dataset.tocLevel ?? "2"),
                }))
            setHeadings(next)
        }

        // coalesce mutation bursts into a single scan per frame
        const schedule = () => {
            if (frame) {
                return
            }
            frame = requestAnimationFrame(() => {
                frame = 0
                scan()
            })
        }

        scan()
        const observer = new MutationObserver(schedule)
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            if (frame) {
                cancelAnimationFrame(frame)
            }
            observer.disconnect()
        }
    }, [rescanKey])

    // scroll-spy: mark the top-most heading currently in the viewport band
    useEffect(() => {
        if (headings.length === 0) {
            setActiveId(undefined)
            return
        }
        const elements = headings
            .map((heading) => document.getElementById(heading.id))
            .filter((element): element is HTMLElement => Boolean(element))
        if (elements.length === 0) {
            return
        }
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                if (visible[0]?.target.id) {
                    setActiveId(visible[0].target.id)
                }
            },
            { rootMargin: "-72px 0px -70% 0px", threshold: 0 },
        )
        elements.forEach((element) => observer.observe(element))
        return () => observer.disconnect()
    }, [headings])

    const onJump = useCallback((id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
            setActiveId(id)
        }
    }, [])

    return { headings, activeId, onJump }
}
