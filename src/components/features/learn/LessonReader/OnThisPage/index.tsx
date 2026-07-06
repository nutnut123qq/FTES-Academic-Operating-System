"use client"

import React, { useEffect, useState } from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { LessonHeading } from "../../hooks/useQueryLearnLessonSwr"

/** Props for {@link OnThisPage}. */
export interface OnThisPageProps {
    /** In-order headings scanned from the lesson body. */
    headings: Array<LessonHeading>
}

/**
 * RIGHT "On this page" table-of-contents rail for the lesson reader. Renders the
 * lesson's H2/H3 anchors, highlights the section nearest the top of the viewport
 * (scroll-spy via IntersectionObserver), and jumps to a heading on click.
 *
 * Self-hides when the lesson has no headings. Sticky on desktop; hidden below lg
 * (the reader stacks on mobile, TOC is redundant there).
 */
export const OnThisPage = ({ headings }: OnThisPageProps) => {
    const t = useTranslations("learn")
    const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

    useEffect(() => {
        if (headings.length === 0) {
            return
        }
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                if (visible[0]) {
                    setActiveId(visible[0].target.id)
                }
            },
            { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
        )
        for (const heading of headings) {
            const node = document.getElementById(heading.id)
            if (node) {
                observer.observe(node)
            }
        }
        return () => observer.disconnect()
    }, [headings])

    if (headings.length === 0) {
        return null
    }

    const onJump = (id: string) => {
        const node = document.getElementById(id)
        if (node) {
            node.scrollIntoView({ behavior: "smooth", block: "start" })
            setActiveId(id)
        }
    }

    return (
        <nav aria-label={t("reader.onThisPage")} className="flex flex-col gap-2">
            <Typography type="body-xs" weight="semibold" color="muted" className="uppercase tracking-wide">
                {t("reader.onThisPage")}
            </Typography>
            <ul className="flex flex-col gap-1 border-l border-separator">
                {headings.map((heading) => {
                    const isActive = heading.id === activeId
                    return (
                        <li key={heading.id}>
                            <button
                                type="button"
                                onClick={() => onJump(heading.id)}
                                className={cn(
                                    "-ml-px block border-l-2 py-1 text-left text-sm transition-colors",
                                    heading.level === 3 ? "pl-6" : "pl-3",
                                    isActive
                                        ? "border-accent text-accent"
                                        : "border-transparent text-muted hover:text-foreground",
                                )}
                            >
                                {heading.text}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
