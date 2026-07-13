"use client"

import React from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import type { ScorecardView } from "@/modules/api/rest/mockinterview"
import { VERDICT_COLOR } from "./constants"

/** Props for {@link Scorecard}. */
export interface ScorecardProps {
    scorecard: ScorecardView
    onRetry: () => void
}

/**
 * Quick markdown detector so we can render rich AI feedback through {@link MarkdownContent}
 * while keeping plain-text bullets in the familiar Typography list style.
 */
const MARKDOWN_RE = /(\*\*|\*|__|_|`|#|\[.*\]\(.*\)|^[-*] |\d+\.\s|>|!?\[)/m
const looksLikeMarkdown = (text: string): boolean => MARKDOWN_RE.test(text)

/**
 * Turn a snake_case attribute key into a readable Title Case label
 * (e.g. `structured_thinking` → `Structured thinking`).
 */
const formatAttributeKey = (key: string): string =>
    key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())

/**
 * Graded scorecard: overall score + verdict chip + per-question feedback.
 * Rich fields (attributeScores/strengths/gaps/followUp) self-hide when the backend
 * returns null/empty and display when the grade-session response carries them.
 *
 * @param props - {@link ScorecardProps}
 */
export const Scorecard = ({ scorecard, onRetry }: ScorecardProps) => {
    const t = useTranslations("learn")
    const color = VERDICT_COLOR[scorecard.verdict] ?? "default"

    const attributeEntries = scorecard.attributeScores
        ? Object.entries(scorecard.attributeScores)
        : []
    const hasStrengths = scorecard.strengths && scorecard.strengths.length > 0
    const hasGaps = scorecard.gaps && scorecard.gaps.length > 0
    const strengthsHaveMarkdown = hasStrengths && scorecard.strengths!.some(looksLikeMarkdown)
    const gapsHaveMarkdown = hasGaps && scorecard.gaps!.some(looksLikeMarkdown)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-default bg-surface p-6">
                <Typography type="body-xs" color="muted">{t("mockInterview.scoreLabel")}</Typography>
                <Typography type="h2" className="tabular-nums">
                    {scorecard.overallScore}
                    <span className="text-muted">/100</span>
                </Typography>
                <Chip color={color} size="sm" variant="soft">
                    {t(`mockInterview.verdict.${scorecard.verdict}`)}
                </Chip>
            </div>

            {attributeEntries.length > 0 ? (
                <div className="flex flex-col gap-3">
                    <Typography type="body-sm" weight="semibold">{t("mockInterview.attributesTitle")}</Typography>
                    {attributeEntries
                        .sort(([, a], [, b]) => b - a)
                        .map(([key, value]) => {
                            const label = t(`mockInterview.attribute.${key}`, { defaultValue: formatAttributeKey(key) })
                            return (
                                <ProgressMeter
                                    key={key}
                                    value={value}
                                    max={100}
                                    label={label}
                                    showValue
                                    aria-label={label}
                                />
                            )
                        })}
                </div>
            ) : null}

            <div className="flex flex-col gap-3">
                <Typography type="body-sm" weight="semibold">{t("mockInterview.reviewsTitle")}</Typography>
                {scorecard.questionReviews.map((review) => (
                    <div
                        key={review.questionIndex}
                        className="flex flex-col gap-1 rounded-2xl border border-default p-4"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <Typography type="body-xs" color="muted">
                                {t("mockInterview.questionN", { n: review.questionIndex + 1 })}
                            </Typography>
                            <Typography type="body-sm" weight="semibold" className="tabular-nums">
                                {review.score}/100
                            </Typography>
                        </div>
                        {looksLikeMarkdown(review.feedback) ? (
                            <MarkdownContent markdown={review.feedback} className="text-xs leading-relaxed" />
                        ) : (
                            <Typography type="body-xs">{review.feedback}</Typography>
                        )}
                    </div>
                ))}
            </div>

            {hasStrengths ? (
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="semibold">{t("mockInterview.strengths")}</Typography>
                    {strengthsHaveMarkdown ? (
                        <MarkdownContent
                            markdown={scorecard.strengths!.map((item) => `- ${item}`).join("\n")}
                            className="text-xs leading-relaxed"
                        />
                    ) : (
                        scorecard.strengths!.map((item, i) => (
                            <Typography key={i} type="body-xs" color="muted">• {item}</Typography>
                        ))
                    )}
                </div>
            ) : null}

            {hasGaps ? (
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="semibold">{t("mockInterview.gaps")}</Typography>
                    {gapsHaveMarkdown ? (
                        <MarkdownContent
                            markdown={scorecard.gaps!.map((item) => `- ${item}`).join("\n")}
                            className="text-xs leading-relaxed"
                        />
                    ) : (
                        scorecard.gaps!.map((item, i) => (
                            <Typography key={i} type="body-xs" color="muted">• {item}</Typography>
                        ))
                    )}
                </div>
            ) : null}

            {scorecard.followUpQuestion ? (
                <div className="flex flex-col gap-1 rounded-2xl border border-default p-4">
                    <Typography type="body-xs" color="muted">{t("mockInterview.followUp")}</Typography>
                    {looksLikeMarkdown(scorecard.followUpQuestion) ? (
                        <MarkdownContent markdown={scorecard.followUpQuestion} className="text-sm leading-relaxed" />
                    ) : (
                        <Typography type="body-sm">{scorecard.followUpQuestion}</Typography>
                    )}
                </div>
            ) : null}

            <div>
                <Button variant="primary" onPress={onRetry}>{t("mockInterview.retryPractice")}</Button>
            </div>
        </div>
    )
}

export default Scorecard
