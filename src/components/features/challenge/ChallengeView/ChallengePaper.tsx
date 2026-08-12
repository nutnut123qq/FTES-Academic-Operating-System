"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { ArrowSquareOutIcon, FileXIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { classifyChallengePaper } from "./paperKind"

/** Props for {@link ChallengePaper}. */
export interface ChallengePaperProps {
    /** Direct URL of the paper file (BE `ChallengeView.paperUrl`). */
    paperUrl: string | null
    /** MIME of the paper (BE `ChallengeView.paperMime`); `null` when unknown. */
    paperMime: string | null
    /** Challenge title — used as the accessible name of the picture / embedded viewer. */
    title: string
}

/**
 * The EXAM PAPER of a challenge, to READ.
 *
 * This is what folding Practical Exams into the challenge bank means on screen: a `pe`-
 * tagged challenge carries the paper file, the learner opens it and practises against it,
 * and that is the whole surface. **There is deliberately no answer upload and no grade** —
 * AI grading is locked (sold later), so this component must never grow a submission form.
 *
 * Rendered by kind ({@link classifyChallengePaper}):
 * - **picture** → inline `<img>`, capped at a readable height, wrapped in a link that
 *   opens the full-size original in a new tab (a scan is often taller than the fold). A
 *   plain `<img>` on purpose: the paper lives on whatever storage host the BE picked, and
 *   `next/image` would need that host allow-listed in `next.config.ts`.
 * - **PDF** → embedded in a fixed-height `<iframe>` (the browser's own viewer, so it
 *   scrolls and zooms), plus the same "open in a new tab" escape hatch above it.
 * - **anything else** (DOC/DOCX/ZIP…) → says plainly that it cannot be shown inline and
 *   offers the link. No fake render.
 *
 * @param props - {@link ChallengePaperProps}
 */
export const ChallengePaper = ({ paperUrl, paperMime, title }: ChallengePaperProps) => {
    const t = useTranslations("challenge")
    const kind = classifyChallengePaper(paperUrl, paperMime)

    if (kind === "MISSING" || !paperUrl) {
        return null
    }

    /** "Open the original" — every branch offers it; for UNSUPPORTED it is the only path. */
    const openLink = (
        <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-2 text-sm text-accent no-underline transition-colors hover:text-foreground"
        >
            <ArrowSquareOutIcon className="size-4" aria-hidden focusable="false" />
            {t("paper.open")}
        </a>
    )

    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="body" weight="semibold">
                    {t("paper.title")}
                </Typography>
                {openLink}
            </div>

            {kind === "IMAGE" ? (
                <a
                    href={paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("paper.openImage")}
                    className="block overflow-hidden rounded-2xl border border-separator bg-default"
                >
                    <img
                        src={paperUrl}
                        alt={t("paper.imageAlt", { title })}
                        loading="lazy"
                        className="mx-auto max-h-[70vh] w-full object-contain"
                    />
                </a>
            ) : kind === "PDF" ? (
                <iframe
                    src={paperUrl}
                    title={t("paper.imageAlt", { title })}
                    className="h-[70vh] w-full rounded-2xl border border-separator bg-default"
                />
            ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-6 text-center">
                    <FileXIcon className="size-8 text-muted" aria-hidden focusable="false" />
                    <Typography type="body-sm" color="muted">
                        {t("paper.noPreview")}
                    </Typography>
                </div>
            )}

            {/* The product decision, said out loud: read the paper, practise on your own —
                handing it in for an AI grade is not open yet. */}
            <Typography type="body-xs" color="muted">
                {t("paper.gradingLocked")}
            </Typography>
        </section>
    )
}
