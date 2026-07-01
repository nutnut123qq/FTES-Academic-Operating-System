"use client"

import {
    useCallback,
    useEffect,
    useState,
} from "react"

/** A single entry in the "on this page" outline. */
export interface TocHeading {
    /** Anchor id of the heading element (matches the rendered `id`). */
    id: string
    /** Plain-text label shown in the outline. */
    text: string
    /** Heading depth (2 or 3) used to indent the row. */
    level: number
}

/** Result of {@link useTableOfContents}. */
export interface UseTableOfContentsResult {
    /** The ordered headings discovered in the active lesson body. */
    headings: Array<TocHeading>
    /** Id of the heading currently in view (scroll-spy), or undefined. */
    activeId?: string
    /** Smooth-scroll the article to the given heading id and mark it active. */
    onJump: (id: string) => void
}

/** Id of the lesson article container the outline scans within. */
const ARTICLE_ID = "lesson-article"

/**
 * Builds the "on this page" outline for the active lesson by scanning the rendered
 * article (`#lesson-article [data-toc]`) for heading anchors, then tracks which
 * heading is in view (scroll-spy) and exposes a smooth-scroll jump.
 *
 * DOM-driven (not data-driven) so it works for any rendered body — markdown
 * headings are tagged with `id` + `data-toc` by the shared `MarkdownContent`
 * renderer. Re-scans whenever `rescanKey` changes (lesson navigation / language
 * switch) and while the article subtree mutates (async markdown render).
 *
 * @param rescanKey - A value that changes when the active lesson changes (its id),
 *   forcing a re-scan. Pass `undefined` when no lesson is active.
 * @returns {@link UseTableOfContentsResult} headings, the active id, and a jumper.
 */
export const useTableOfContents = (rescanKey: string | undefined): UseTableOfContentsResult => {
    const [headings, setHeadings] = useState<Array<TocHeading>>([])
    const [activeId, setActiveId] = useState<string | undefined>(undefined)

    // scan the rendered article for heading anchors; re-run on lesson change +
    // while the article subtree mutates (markdown renders client-side, async).
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
                    // prefer the clean data-toc-label (set by MarkdownContent) so the hover
                    // anchor "#" / inline code in the heading never leaks into the outline.
                    text: node.dataset.tocLabel ?? node.textContent?.trim() ?? "",
                    level: Number(node.dataset.tocLevel ?? "2"),
                }))
            setHeadings(next)
        }

        // coalesce mutation bursts into a single scan per frame.
        const schedule = () => {
            if (frame) {
                return
            }
            frame = requestAnimationFrame(() => {
                frame = 0
                scan()
            })
        }

        // Observe a STABLE root (document.body) instead of polling a fixed number
        // of frames for #lesson-article. On a hard reload the article mounts only
        // after the SWR fetch + markdown render resolves, which can exceed any
        // fixed timeout — the old 60-frame poll then gave up with an empty outline
        // and never re-scanned. body always exists, so we reliably catch both the
        // article mounting and its async heading render, on hard reload AND SPA nav.
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

    // scroll-spy: mark the top-most heading currently in the viewport band.
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
            {
                // bias the active band just under the sticky navbar
                rootMargin: "-72px 0px -70% 0px",
                threshold: 0,
            },
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

    return {
        headings,
        activeId,
        onJump,
    }
}
