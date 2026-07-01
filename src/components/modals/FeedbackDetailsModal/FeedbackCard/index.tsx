"use client"

import { CheckCircleIcon, LightbulbIcon, MapPinIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { Card, Chip, cn, Link } from "@heroui/react"
import { useTranslations } from "next-intl"
import React, { useMemo } from "react"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import type { SubmissionFeedbackEntity } from "@/modules/types/entities/submission-feedback"
import { SubmissionFeedbackSeverity } from "@/modules/types/enums/submission-feedback-severity"
import { buildGithubFileUrl } from "@/modules/utils/github-file-url"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link FeedbackCard}.
 */
interface FeedbackCardProps extends WithClassNames<undefined> {
    /** One feedback row from the grader. */
    submissionFeedback: SubmissionFeedbackEntity
    /** GitHub repo URL for the selected submission attempt (used for file links). */
    repositoryUrl?: string
    /**
     * Render the inner content only (no bordered `Card` wrapper) — for use as an
     * inset row inside a parent surface card (e.g. the submission-result findings
     * list). Default `false` keeps the standalone bordered card (modal usage).
     */
    frameless?: boolean
}

/**
 * Feedback card for a single grader note.
 *
 * @param props - Feedback row.
 */
export const FeedbackCard = (props: FeedbackCardProps) => {
    const { submissionFeedback, repositoryUrl, frameless = false, className } = props
    const {
        message,
        detail,
        severity,
        location,
        suggestion,
    } = submissionFeedback
    const t = useTranslations()

    const statusChip = useMemo(() => {
        if (!suggestion) {
            return (
                <Chip color="success" size="sm" variant="soft" className="shrink-0">
                    <CheckCircleIcon className="size-4" />
                    <Chip.Label>{t("feedback.perfect")}</Chip.Label>
                </Chip>
            )
        }
        switch (severity) {
        case SubmissionFeedbackSeverity.High:
            return (
                <Chip color="danger" size="sm" variant="soft" className="shrink-0">
                    <WarningCircleIcon className="size-4" />
                    <Chip.Label>{t("feedback.severity.high")}</Chip.Label>
                </Chip>
            )
        case SubmissionFeedbackSeverity.Medium:
            return (
                <Chip color="warning" size="sm" variant="soft" className="shrink-0">
                    <WarningCircleIcon className="size-4" />
                    <Chip.Label>{t("feedback.severity.medium")}</Chip.Label>
                </Chip>
            )
        case SubmissionFeedbackSeverity.Low:
            return (
                <Chip color="default" size="sm" variant="soft" className="shrink-0">
                    <WarningCircleIcon className="size-4" />
                    <Chip.Label>{t("feedback.severity.low")}</Chip.Label>
                </Chip>
            )
        default:
            return (
                <Chip color="warning" size="sm" variant="soft" className="shrink-0">
                    <WarningCircleIcon className="size-4" />
                    <Chip.Label>{t("feedback.severity.unknown")}</Chip.Label>
                </Chip>
            )
        }
    }, [severity, suggestion, t])

    const locationLabel = useMemo(() => {
        if (location == null) {
            return null
        }
        const trimmed = location.trim()
        if (trimmed.length === 0 || trimmed.toLowerCase() === "null") {
            return null
        }
        return trimmed
    }, [location])

    const locationHref = useMemo(() => {
        if (!locationLabel || !repositoryUrl) {
            return null
        }
        return buildGithubFileUrl({
            repositoryUrl,
            location: locationLabel,
        })
    }, [locationLabel, repositoryUrl])

    const showFooter = Boolean(locationLabel || suggestion)

    const inner = (
        <div className={cn("flex flex-col gap-3", frameless ? "px-4 py-4" : "p-3")}>
            <div>
                {statusChip}
            </div>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                    <MarkdownContent markdown={message} className="text-sm font-medium" />
                    {detail ? (
                        <MarkdownContent markdown={detail} className="text-xs text-muted" />
                    ) : null}
                </div>
            </div>
            {showFooter ? (
                <div
                    className={cn("border-t border-divider", frameless ? "-mx-4" : "-mx-3")}
                    role="separator"
                />
            ) : null}
            {locationLabel ? (
                <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPinIcon className="size-4 shrink-0" />
                    {locationHref ? (
                        <Link
                            href={locationHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t("feedback.openFileOnGithub")}
                            className="min-w-0 break-words text-accent hover:underline"
                        >
                            {locationLabel}
                        </Link>
                    ) : (
                        <span className="min-w-0 break-words">{locationLabel}</span>
                    )}
                </div>
            ) : null}
            {suggestion ? (
                <div className="flex items-center gap-1.5">
                    <LightbulbIcon className="size-4 shrink-0 text-muted" />
                    <MarkdownContent markdown={suggestion} className="text-sm text-muted" />
                </div>
            ) : null}
        </div>
    )

    // frameless → inner row only (inset into a parent surface card); else standalone bordered card
    if (frameless) {
        return <div className={className}>{inner}</div>
    }

    return (
        <Card className={cn("border border-default bg-surface p-0 shadow-none", className)}>
            <Card.Content>{inner}</Card.Content>
        </Card>
    )
}
