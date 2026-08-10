"use client"

import React, { useEffect, useMemo, useState } from "react"
import { codeToHtml } from "shiki"
import { Typography, cn } from "@heroui/react"
import { ChatCenteredDotsIcon, LightbulbIcon } from "@phosphor-icons/react"
import type { CodeChange } from "@/modules/api/rest/ai"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ProjectReviewFile}. */
export interface ProjectReviewFileProps extends WithClassNames<undefined> {
    /** The file's UTF-8 text content (from the BE project/file endpoint). */
    content: string
    /** Shiki language id resolved from the file extension (e.g. `python`, `ts`, `text`). */
    language: string
    /** Shiki theme id resolved from the app theme. */
    theme: string
    /** The changes flagged on THIS file (already filtered to its path). */
    changes: Array<CodeChange>
    /** Localized caption for the review comment's reason block ("Nhận xét"). */
    reasonLabel: string
    /** Localized caption for the review comment's suggestion block ("Đề xuất"). */
    suggestionLabel: string
    /** Localized caption for the diff's "before" (current) block ("Trước"). */
    beforeLabel: string
    /** Localized caption for the diff's "after" (suggested) block ("Sau"). */
    afterLabel: string
}

/** Escapes text for the plain (pre-highlight / fallback) line render. */
const splitLines = (content: string): Array<string> => content.replace(/\n$/, "").split("\n")

/** Props for {@link ReviewComment}. */
export interface ReviewCommentProps {
    /** The change to render (reason + suggestion + optional before/after diff). */
    comment: CodeChange
    /** Localized caption for the reason block ("Nhận xét"). */
    reasonLabel: string
    /** Localized caption for the suggestion block ("Đề xuất"). */
    suggestionLabel: string
    /** Localized caption for the diff's "before" (current) block ("Trước"). */
    beforeLabel: string
    /** Localized caption for the diff's "after" (suggested) block ("Sau"). */
    afterLabel: string
}

/**
 * A display-only GitHub-style before/after diff for one flagged change: the current line(s)
 * in red (`-`), the suggested replacement in green (`+`). Pure and props-only (copy passed in),
 * theme-aware via semantic tokens, monospace; there is NO "apply" action — the learner reads
 * it. Long lines soft-wrap so the diff never forces a page-level horizontal scroll.
 */
const BeforeAfterDiff = ({
    oldCode,
    newCode,
    beforeLabel,
    afterLabel,
}: {
    oldCode: string
    newCode: string
    beforeLabel: string
    afterLabel: string
}) => (
    <div className="flex flex-col gap-2">
        <DiffBlock label={beforeLabel} code={oldCode} tone="danger" sign="-" />
        <DiffBlock label={afterLabel} code={newCode} tone="success" sign="+" />
    </div>
)

/** One side of {@link BeforeAfterDiff} — a labelled monospace block tinted by `tone`. */
const DiffBlock = ({
    label,
    code,
    tone,
    sign,
}: {
    label: string
    code: string
    tone: "danger" | "success"
    sign: string
}) => (
    <div
        className={cn(
            "overflow-hidden rounded-lg border",
            tone === "danger" ? "border-danger/30" : "border-success/30",
        )}
    >
        <div className={cn("px-2 py-1", tone === "danger" ? "bg-danger/10" : "bg-success/10")}>
            <Typography
                type="body-xs"
                weight="semibold"
                className={tone === "danger" ? "text-danger" : "text-success"}
            >
                {label}
            </Typography>
        </div>
        <div
            className={cn(
                "flex flex-col font-mono text-xs leading-relaxed",
                tone === "danger" ? "bg-danger/5" : "bg-success/5",
            )}
        >
            {splitLines(code).map((line, index) => (
                <div key={index} className="flex items-start gap-2 px-3 py-0.5">
                    <span
                        aria-hidden
                        className={cn("select-none", tone === "danger" ? "text-danger" : "text-success")}
                    >
                        {sign}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-foreground">
                        {line.length > 0 ? line : " "}
                    </span>
                </div>
            ))}
        </div>
    </div>
)

/**
 * One GitHub-style review comment card (reason + suggestion, plus an optional display-only
 * before/after diff when the change carries both `oldCode` and `newCode`). Reused both inline
 * (pinned under a flagged line), as a file-level banner (for `line <= 0` / out-of-range
 * comments), and by the result view's flat fallback list (comments whose file isn't in the
 * served tree). Copy is passed in so the card stays i18n-free.
 */
export const ReviewComment = ({
    comment,
    reasonLabel,
    suggestionLabel,
    beforeLabel,
    afterLabel,
}: ReviewCommentProps) => (
    <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
            <ChatCenteredDotsIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="flex min-w-0 flex-col gap-1">
                <Typography type="body-xs" weight="semibold" className="text-warning">
                    {reasonLabel}
                </Typography>
                <Typography type="body-sm" className="whitespace-pre-wrap font-sans">
                    {comment.reason}
                </Typography>
            </div>
        </div>
        <div className="flex items-start gap-2">
            <LightbulbIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-success" />
            <div className="flex min-w-0 flex-col gap-1">
                <Typography type="body-xs" weight="semibold" className="text-success">
                    {suggestionLabel}
                </Typography>
                <Typography type="body-sm" className="whitespace-pre-wrap font-sans">
                    {comment.suggestion}
                </Typography>
            </div>
        </div>
        {/* Before/after code diff — display-only, shown ONLY when the grader emitted both
            snippet sides (older grades / prose-only suggestions omit them). */}
        {typeof comment.oldCode === "string" && typeof comment.newCode === "string" ? (
            <BeforeAfterDiff
                oldCode={comment.oldCode}
                newCode={comment.newCode}
                beforeLabel={beforeLabel}
                afterLabel={afterLabel}
            />
        ) : null}
    </div>
)

/**
 * Renders ONE project file with line numbers + shiki highlight and GitHub-style inline
 * review comments injected at each flagged line (PIN §4B). Pure and props-only: shiki runs
 * in an effect (like the shared `CodeToHtml`), producing per-line HTML that is interleaved
 * with warning-tinted comment cards; all copy (`reasonLabel` / `suggestionLabel`) is passed
 * in so the block stays i18n-free. Long lines soft-wrap so a review card never forces a
 * page-level horizontal scroll.
 */
export const ProjectReviewFile = ({
    content,
    language,
    theme,
    changes,
    reasonLabel,
    suggestionLabel,
    beforeLabel,
    afterLabel,
    className,
}: ProjectReviewFileProps) => {
    /** Per-line highlighted innerHTML from shiki; `null` keeps the plain-text fallback. */
    const [highlightedLines, setHighlightedLines] = useState<Array<string> | null>(null)

    // Group the changes by their 1-based line so a line with multiple comments shows them all.
    const commentsByLine = useMemo(() => {
        const map = new Map<number, Array<CodeChange>>()
        for (const change of changes) {
            const list = map.get(change.line)
            if (list) {
                list.push(change)
            } else {
                map.set(change.line, [change])
            }
        }
        return map
    }, [changes])

    // Run shiki once per content/language/theme; parse its <pre><code> into per-line HTML so
    // each line can be a row we can inject a comment after. `cancelled` blocks a stale write.
    useEffect(() => {
        let cancelled = false
        setHighlightedLines(null)
        codeToHtml(content.replace(/\n$/, ""), { lang: language, theme })
            .then((html) => {
                if (cancelled) {
                    return
                }
                const doc = new DOMParser().parseFromString(html, "text/html")
                const codeEl = doc.querySelector("pre > code")
                const lineSpans = codeEl ? Array.from(codeEl.querySelectorAll(":scope > .line")) : []
                setHighlightedLines(lineSpans.map((span) => span.innerHTML))
            })
            .catch((error) => {
                // Unknown lang / WASM error → keep the plain-text fallback + log for debugging.
                console.error("ProjectReviewFile: shiki highlight failed", error)
            })
        return () => {
            cancelled = true
        }
    }, [content, language, theme])

    // Prefer shiki's lines once ready; fall back to raw text lines until then / on error.
    const plainLines = useMemo(() => splitLines(content), [content])
    const lines = highlightedLines ?? plainLines

    // Comments the inline map can never reach: `line <= 0` (file-level per schema, `line=0`) or a
    // line past the file's end. Without this they'd be silently lost (file shows orange, no comment).
    const fileLevelComments = useMemo(
        () => changes.filter((change) => change.line < 1 || change.line > lines.length),
        [changes, lines.length],
    )

    return (
        <div className={cn("overflow-hidden rounded-2xl border border-default bg-background", className)}>
            {fileLevelComments.length > 0 && (
                <div className="flex flex-col gap-3 border-b border-warning/40 bg-warning/5 px-3 py-3">
                    {fileLevelComments.map((comment, commentIndex) => (
                        <ReviewComment
                            key={commentIndex}
                            comment={comment}
                            reasonLabel={reasonLabel}
                            suggestionLabel={suggestionLabel}
                            beforeLabel={beforeLabel}
                            afterLabel={afterLabel}
                        />
                    ))}
                </div>
            )}
            <div className="font-mono text-xs leading-relaxed">
                {lines.map((line, index) => {
                    const lineNo = index + 1
                    const comments = commentsByLine.get(lineNo)
                    const isFlagged = comments !== undefined
                    return (
                        <React.Fragment key={lineNo}>
                            <div
                                className={cn(
                                    "flex items-start gap-3 px-3",
                                    isFlagged && "bg-warning/10",
                                )}
                            >
                                <span className="w-8 shrink-0 select-none py-0.5 text-end tabular-nums text-muted">
                                    {lineNo}
                                </span>
                                {highlightedLines ? (
                                    <code
                                        className="min-w-0 flex-1 whitespace-pre-wrap break-words py-0.5 [&_*]:!bg-transparent"
                                        dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }}
                                    />
                                ) : (
                                    <code className="min-w-0 flex-1 whitespace-pre-wrap break-words py-0.5 text-foreground">
                                        {line.length > 0 ? line : " "}
                                    </code>
                                )}
                            </div>
                            {comments?.map((comment, commentIndex) => (
                                <div
                                    key={commentIndex}
                                    className="border-y border-warning/40 bg-warning/5 px-3 py-3 ps-11"
                                >
                                    <ReviewComment
                                        comment={comment}
                                        reasonLabel={reasonLabel}
                                        suggestionLabel={suggestionLabel}
                                        beforeLabel={beforeLabel}
                                        afterLabel={afterLabel}
                                    />
                                </div>
                            ))}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
