"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import {
    CheckCircleIcon,
    LightbulbIcon,
    NotePencilIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AiToolModelNote } from "../AiToolShell"
import type { CvReviewResult } from "../types"

/** Colour band for the score badge: red < 50, amber < 75, green otherwise. */
const scoreTone = (score: number): string => {
    if (score < 50) return "border-danger/40 bg-danger/5 text-danger"
    if (score < 75) return "border-warning/40 bg-warning/5 text-warning"
    return "border-success/40 bg-success/5 text-success"
}

/** A titled list block (strengths / improvements) with a leading icon. */
const ListBlock = ({
    icon,
    title,
    items,
}: {
    icon: React.ReactNode
    title: string
    items: string[]
}) => {
    if (items.length === 0) return null
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {icon}
                <Typography type="body-sm" weight="semibold">
                    {title}
                </Typography>
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-6">
                {items.map((item, index) => (
                    <li key={index}>
                        <Typography type="body-sm" color="muted">
                            {item}
                        </Typography>
                    </li>
                ))}
            </ul>
        </div>
    )
}

/** Props for {@link CvReviewResultPanel}. */
export interface CvReviewResultPanelProps {
    /** The parsed CV review job result. */
    result: CvReviewResult
}

/**
 * Renders a structured CV review: a large score badge, the overall summary, the
 * strengths / improvements lists, per-section feedback, and the producing model.
 * Every block degrades gracefully when its field is absent.
 */
export const CvReviewResultPanel = ({ result }: CvReviewResultPanelProps) => {
    const t = useTranslations("aiPlatform.toolPages.cvReview")
    const strengths = (result.strengths ?? []).filter((item) => item.trim().length > 0)
    const improvements = (result.improvements ?? []).filter((item) => item.trim().length > 0)
    const sectionFeedback = (result.sectionFeedback ?? []).filter(
        (item) => item.comment?.trim().length > 0,
    )
    const hasScore = typeof result.score === "number"

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-separator p-5">
            <div className="flex flex-wrap items-center gap-4">
                {hasScore ? (
                    <div
                        className={cn(
                            "flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl border",
                            scoreTone(result.score as number),
                        )}
                    >
                        <span className="text-2xl font-bold leading-none">
                            {Math.round(result.score as number)}
                        </span>
                        <span className="text-xs opacity-70">/100</span>
                    </div>
                ) : null}
                {result.summary ? (
                    <Typography type="body-sm" color="muted" className="min-w-0 flex-1">
                        {result.summary}
                    </Typography>
                ) : null}
            </div>

            <ListBlock
                icon={<CheckCircleIcon aria-hidden focusable="false" className="size-4 text-success" />}
                title={t("strengths")}
                items={strengths}
            />
            <ListBlock
                icon={<LightbulbIcon aria-hidden focusable="false" className="size-4 text-warning" />}
                title={t("improvements")}
                items={improvements}
            />

            {sectionFeedback.length > 0 ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <NotePencilIcon aria-hidden focusable="false" className="size-4 text-accent" />
                        <Typography type="body-sm" weight="semibold">
                            {t("sectionFeedback")}
                        </Typography>
                    </div>
                    <div className="flex flex-col gap-2">
                        {sectionFeedback.map((item, index) => (
                            <div
                                key={index}
                                className="rounded-xl border border-default bg-surface px-3 py-2"
                            >
                                <Typography type="body-xs" weight="semibold" className="uppercase tracking-wide">
                                    {item.section}
                                </Typography>
                                <Typography type="body-sm" color="muted">
                                    {item.comment}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <AiToolModelNote model={result.model} />
        </div>
    )
}
