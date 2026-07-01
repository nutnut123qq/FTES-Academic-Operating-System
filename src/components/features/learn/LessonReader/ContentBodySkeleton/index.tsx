"use client"

import React from "react"
import {
    Skeleton,
    cn,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SkeletonParagraph } from "@/components/reuseable/SkeletonParagraph"
import { SkeletonText } from "@/components/reuseable/SkeletonText"

/** Layout variant mirrored from {@link ContentBody} (V2 vs legacy). */
export type ContentBodySkeletonVariant = "v2" | "legacy"

export type ContentBodySkeletonProps = WithClassNames<undefined> & {
    /** `v2` — article only; `legacy` — toolbar + article. */
    variant?: ContentBodySkeletonVariant
}

/** One skeleton section: a heading width plus how many body lines follow it. */
interface MarkdownArticleSection {
    /** Tailwind width class for the section heading bar (e.g. `w-2/5`). */
    headingWidth: string
    /** Number of skeleton paragraph lines under the heading. */
    lines: number
}

/**
 * Section blocks (heading + body paragraph) standing in for the long-form lesson
 * body. Extra blocks also absorb the vertical space of the removed language-tab
 * row, which not every content renders.
 */
const MARKDOWN_ARTICLE_SECTIONS: Array<MarkdownArticleSection> = [
    { headingWidth: "w-2/5", lines: 4 },
    { headingWidth: "w-1/3", lines: 5 },
    { headingWidth: "w-1/4", lines: 4 },
    { headingWidth: "w-2/5", lines: 6 },
    { headingWidth: "w-1/3", lines: 3 },
]

/**
 * Markdown article block: section headings (`text-xl` in prose) + body paragraphs.
 * gap-3 giữa các section; gap-2 giữa heading và paragraph trong mỗi section.
 */
const MarkdownArticleSkeleton = () => (
    <div className="flex flex-col gap-3">
        {MARKDOWN_ARTICLE_SECTIONS.map((section, index) => (
            // gap-2 = heading ↔ paragraph (cụm con sát nhau trong 1 section)
            <div key={index} className="flex flex-col gap-2">
                <SkeletonText size="xl" width={section.headingWidth} />
                <SkeletonParagraph size="sm" lines={section.lines} />
            </div>
        ))}
    </div>
)

/**
 * Icon action row mirroring {@link ActionToolbar} (bookmark, share, fullscreen).
 */
const ActionToolbarSkeleton = () => (
    <div className="flex items-center gap-2">
        {Array.from({ length: 3 }).map((_unused, index) => (
            <Skeleton
                key={index}
                className="size-9 rounded-xl"
            />
        ))}
    </div>
)

/**
 * Loading placeholder for {@link ContentBody} / {@link ContentBodyV2} / {@link ContentBodyLegacy}.
 * @param props - {@link ContentBodySkeletonProps}
 */
export const ContentBodySkeleton = ({
    className,
    variant = "v2",
}: ContentBodySkeletonProps) => {
    if (variant === "legacy") {
        // gap-3 = toolbar ↔ article (trong 1 block skeleton)
        return (
            <div className={cn("flex flex-col gap-3 text-sm text-muted", className)}>
                <ActionToolbarSkeleton />
                <MarkdownArticleSkeleton />
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col overflow-x-auto text-sm text-muted", className)}>
            <MarkdownArticleSkeleton />
        </div>
    )
}
