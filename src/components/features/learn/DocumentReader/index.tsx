"use client"

import React, { useState } from "react"
import { Button, Card, CardContent, Typography, cn } from "@heroui/react"
import { LockSimpleIcon } from "@phosphor-icons/react"
import { useTranslations, useFormatter } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LessonResourceLinks } from "@/components/features/learn/LessonReader/LessonResourceLinks"
import { LessonDocumentHtml } from "@/components/features/learn/LessonReader/LessonDocumentHtml"
import { SelectionHintCallout } from "@/components/features/learn/LessonReader/ContentAiSelectionAsk/SelectionHintCallout"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { BookOpenIcon } from "@phosphor-icons/react"
import type { TeaserInfo } from "@/modules/api/rest/course"

/** Props for {@link DocumentReader}. */
export interface DocumentReaderProps {
    /** Raw markdown body (may be empty for migrated HTML-only or link-only lessons). */
    bodyMd: string
    /** Author-authored HTML fallback for un-migrated lessons. */
    documentHtml: string | null
    /** Whether the BE truncated this to a teaser. */
    locked: boolean
    /** Teaser metadata when locked (cheapest package, reason). */
    teaser: TeaserInfo | null
    /** BE access level — used to choose paywall copy. */
    accessLevel: string | null
    /**
     * BE lesson content-type ("VIDEO" | "DOCUMENT" | ...). This reader is only mounted
     * for a DOCUMENT lesson, but the flag is threaded so the partial-blur teaser gate is
     * explicit (blur belongs to DOCUMENT free-trial only, never VIDEO).
     */
    contentType: string
    /** Course slug for routing. */
    courseId: string
    /** Resolved course UUID (for package/product resolution). */
    courseRawId: string
    /** Human course title (modal header). */
    courseTitle: string
    /** Course cover art (`course.imageHeader`) — branded into the package-gate modal; empty → lock-icon fallback. */
    courseCoverUrl?: string
    /** Lesson id (route contentId). */
    lessonId: string
    /** Human lesson title (modal copy). */
    lessonTitle: string
    /** Slugs of packages that unlock this lesson. */
    packageSlugs: Array<string>
    /** Called after a successful purchase/free enrollment. */
    onPurchased?: () => void
}

/**
 * Document lesson reader: renders the markdown body (or HTML fallback / resource links)
 * inside a paper card with anchored headings, a bottom teaser fade when locked, and an
 * inline paywall card that opens the shared package gate modal.
 *
 * The right-rail "On this page" TOC scans `#lesson-article [data-toc]` automatically,
 * so no extra wiring is needed here.
 */
export const DocumentReader = ({
    bodyMd,
    documentHtml,
    locked,
    teaser,
    accessLevel,
    contentType,
    courseId,
    courseRawId,
    courseTitle,
    courseCoverUrl,
    lessonId,
    lessonTitle,
    packageSlugs,
    onPurchased,
}: DocumentReaderProps) => {
    const t = useTranslations("learn")
    const [gateOpen, setGateOpen] = useState(false)

    const isPreview = accessLevel === "PREVIEW"
    /** Free-trial preview = a locked lesson served as a partial PREVIEW (the "học thử" state). */
    const isTrialPreview = locked && isPreview
    /**
     * The partial-blur cover (bottom fade gradient + `select-none` on the article) is a
     * DOCUMENT free-trial concept only. A fully-locked (no-trial) document still gets the
     * hard paywall card below, but no blur; a VIDEO lesson never reaches this component.
     */
    const showDocumentPreviewTeaser = isTrialPreview && contentType === "DOCUMENT"
    // document-preview-admin-gate: khi hiện teaser học thử của DOCUMENT, KHÔNG render link ấn được.
    // Ranh giới chính là server (BE strip link khỏi teaser preview); đây là lớp PHÒNG THỦ FE phòng
    // trường hợp BE cũ còn trả link — giữ chữ, bỏ URL để không có gì bấm được trong lúc học thử.
    const displayBody = showDocumentPreviewTeaser ? stripPreviewLinks(bodyMd) : bodyMd
    const resourceLinks = displayBody ? extractResourceLinks(displayBody) : []
    const isLinkOnly = resourceLinks.length > 0
    const hasWrittenBody = !!displayBody || !!documentHtml
    /** Is there anything in the reading area at all — text, html, or resource links? */
    const hasTeaserBody = hasWrittenBody || isLinkOnly
    const isReadingEmpty = !locked && !hasWrittenBody
    const showReadingCard = locked || hasWrittenBody || isReadingEmpty

    if (!showReadingCard) {
        return null
    }

    return (
        <>
            <div className="mx-auto w-full max-w-3xl">
                <Card>
                    <CardContent>
                        {/* selection-hint only where there is real selectable text */}
                        {!locked && hasWrittenBody && !isLinkOnly ? <SelectionHintCallout /> : null}
                        <div className="relative">
                            <div
                                id="lesson-article"
                                className={cn("flex flex-col gap-4", showDocumentPreviewTeaser && "select-none")}
                            >
                                {isLinkOnly ? (
                                    <LessonResourceLinks urls={resourceLinks} />
                                ) : displayBody ? (
                                    <MarkdownContent reading markdown={displayBody} />
                                ) : documentHtml ? (
                                    <LessonDocumentHtml html={documentHtml} />
                                ) : isReadingEmpty ? (
                                    <EmptyContent
                                        icon={<BookOpenIcon aria-hidden focusable="false" className="size-8 text-muted" />}
                                        title={t("content.empty2")}
                                    />
                                ) : null}
                            </div>
                            {/* Medium-style teaser fade behind the paywall — ONLY when there is
                                teaser text to fade out. The overlay is `inset-0` (exactly this
                                article box) with a transparent top half, so a SHORT document body
                                fades softly at the bottom and the cover can NEVER exceed the box to
                                spill upward over the lesson title. Still gated on `hasTeaserBody`:
                                a locked lesson whose body is empty (BE returns `bodyMd: ""` for
                                DOCUMENT lessons carrying files/links instead of markdown) has
                                nothing to fade, so skip the overlay. */}
                            {showDocumentPreviewTeaser && hasTeaserBody ? (
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-50% via-surface/60 to-surface" />
                            ) : null}
                        </div>
                        {locked ? (
                            <PaywallCard
                                isPreview={isPreview}
                                teaser={teaser}
                                onOpenGate={() => setGateOpen(true)}
                            />
                        ) : null}
                    </CardContent>
                </Card>
            </div>
            <PackageGateModal
                isOpen={gateOpen}
                onClose={() => setGateOpen(false)}
                courseId={courseId}
                courseRawId={courseRawId}
                courseTitle={courseTitle}
                courseCoverUrl={courseCoverUrl}
                lessonId={lessonId}
                lessonTitle={lessonTitle}
                packageSlugs={packageSlugs}
                cheapestPackage={teaser?.cheapestPackage}
                context="document"
                onPurchased={onPurchased}
            />
        </>
    )
}

/** Inline paywall card shown beneath the teaser fade for locked documents. */
const PaywallCard = ({
    isPreview,
    teaser,
    onOpenGate,
}: {
    isPreview: boolean
    teaser: TeaserInfo | null
    onOpenGate: () => void
}) => {
    const t = useTranslations("learn")
    const format = useFormatter()
    const cheapest = teaser?.cheapestPackage

    return (
        <div className="mt-6 flex flex-col items-start gap-3 border-t border-default pt-6">
            <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
            <Typography type="body" weight="semibold">
                {isPreview ? t("reader.previewTitle") : t("reader.lockedTitle")}
            </Typography>
            <Typography type="body-sm" color="muted">
                {isPreview ? t("reader.previewBody") : t("reader.lockedBody")}
            </Typography>
            {isPreview && cheapest ? (
                <Typography type="body-sm" color="muted">
                    {t("reader.previewCheapest", {
                        name: cheapest.name,
                        price: format.number(Number(cheapest.salePrice)),
                    })}
                </Typography>
            ) : null}
            <Button variant="primary" onPress={onOpenGate}>
                {t("reader.enrollCta")}
            </Button>
        </div>
    )
}

/**
 * document-preview-admin-gate: strip clickable links from a DOCUMENT preview teaser (defensive —
 * the BE already withholds them server-side). Keeps the visible link/anchor text but drops the
 * URL/href so nothing is clickable while previewing: markdown links/images `[text](url)` /
 * `![alt](url)` → `text`/`alt`, reference links + their definition lines, autolinks `<http…>`,
 * bare `http(s)://…` URLs, and `<a>` anchors. Mirrors `LessonContentTeaserService.stripLinks`.
 *
 * EXCEPTION: an EMBEDDED `data:` URI (`![](data:image/…;base64,…)`) is content, not an external
 * link — it opens nothing off-page. The inline `[text](url)`/`![alt](url)` stripper skips a
 * destination beginning with `data:` (negative lookahead) so a data-image stays intact through
 * the preview teaser. Only external http/https links + anchors are removed.
 */
const stripPreviewLinks = (markdown: string): string =>
    markdown
        .replace(/<a\b[^>]*>/gi, "")
        .replace(/<\/a\s*>/gi, "")
        .replace(/!?\[([^\]]*)\]\((?!data:)[^)]*\)/g, "$1")
        .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
        .replace(/^[ \t]*\[[^\]]+\]:[ \t]*\S+.*$/gm, "")
        .replace(/<https?:\/\/[^>\s]+>/g, "")
        .replace(/https?:\/\/\S+/g, "")

/**
 * Extracts external links when a lesson body is essentially JUST link(s) — a URL (or
 * a few) with almost no other prose, the shape most migrated "Tài liệu / Link / Submit"
 * lessons take. Returns the URLs to render as resource cards, or an empty array for a
 * real written body (rendered as markdown as usual).
 */
const extractResourceLinks = (markdown: string): Array<string> => {
    const urls = markdown.match(/https?:\/\/[^\s)\]<>"']+/g) ?? []
    if (urls.length === 0) {
        return []
    }
    const prose = markdown
        .replace(/https?:\/\/[^\s)\]<>"']+/g, " ")
        .replace(/[[\]()`*_#>~|-]/g, " ")
        .replace(/\b(links?|tài liệu|tai lieu|submit|nộp bài|nop bai)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    return prose.length <= 24 ? urls : []
}
