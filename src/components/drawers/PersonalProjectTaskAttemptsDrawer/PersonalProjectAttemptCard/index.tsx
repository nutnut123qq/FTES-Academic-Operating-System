"use client"

import { Clock as ClockIcon, Sparkles as SparkleIcon } from "@gravity-ui/icons"
import React from "react"
import { Chip, cn } from "@heroui/react"

import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface PersonalProjectAttemptCardProps extends WithClassNames<undefined> {
    /** Attempt sequence from API. */
    attemptNumber: number
    /** Numeric score when present. */
    score: number | null
    /** Short AI summary. */
    shortFeedback: string | null
    /** Formatted processed time label. */
    processedAtLabel: string
}

/**
 * One milestone personal-task review attempt row in the attempts drawer.
 *
 * @param props - Attempt display fields for the card.
 */
export const PersonalProjectAttemptCard = (props: PersonalProjectAttemptCardProps) => {
    const {
        attemptNumber,
        score,
        shortFeedback,
        processedAtLabel,
        className,
    } = props
    const t = useTranslations()
    const feedbackText = shortFeedback?.trim() || t("finalProject.page.attemptsDrawer.feedbackEmpty")
    const scoreChip =
        score !== null && score !== undefined ? (
            <Chip
                size="sm"
                variant="secondary"
                color={score >= 7 ? "success" : score >= 4 ? "warning" : "danger"}
            >
                {t("task.attemptScore", { score })}
            </Chip>
        ) : null

    return (
        <article className={cn("rounded-3xl border border-divider/70 bg-content1 p-4 shadow-sm transition hover:border-accent/50 hover:bg-accent/5", className)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-accent">
                        {t("task.attemptNumber", { number: attemptNumber })}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <SparkleIcon className="size-5 shrink-0 text-warning" />
                        {scoreChip}
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                        {feedbackText}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                        <ClockIcon className="size-5 shrink-0" />
                        {processedAtLabel}
                    </div>
                </div>
            </div>
        </article>
    )
}
