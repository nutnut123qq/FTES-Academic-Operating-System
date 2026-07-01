"use client"

import { ScanIcon } from "@phosphor-icons/react"
import React from "react"
import {
    Button,
    Card,
    CardContent,
    cn,
    Label,
    Spinner,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AIProcessingText } from "@/components/reuseable/AIProcessingText"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { StarCiAIBadge } from "@/components/reuseable/StarCiAIBadge"
import { JobCategory } from "@/modules/types/enums/job-category"
import { JobStatus } from "@/modules/types/enums/job-status"

/** Props for {@link FeedbackSection}. */
export interface FeedbackSectionProps extends WithClassNames<undefined> {
    /** Markdown feedback body to render. */
    feedbackMarkdown: string
    /** Whether the backend already returned persisted AI feedback (re-run copy). */
    hasPersistedAiFeedback: boolean
    /** Whether the review action is disabled (submitting/loading). */
    isReviewDisabled: boolean
    /** Whether the review action is pending (submitting or job in flight). */
    isReviewPending: boolean
    /** Active CV review job id, if any. */
    activeCvReviewJobId?: string
    /** Active CV review job status, if any. */
    activeCvReviewJobStatus?: JobStatus
    /** Active CV review job error message, if any. */
    activeCvReviewJobError?: string
    /** Fired to queue (or re-run) the AI CV review. */
    onReview: () => void
    /** Fired to open the CV submission attempts drawer. */
    onOpenAttempts: () => void
}

/**
 * AI feedback section: markdown feedback, review/re-run action, attempts action,
 * and inline job-status line.
 *
 * Presentational: renders the provided feedback/state, no logic.
 * @param props - {@link FeedbackSectionProps}
 */
export const FeedbackSection = ({
    feedbackMarkdown,
    hasPersistedAiFeedback,
    isReviewDisabled,
    isReviewPending,
    activeCvReviewJobId,
    activeCvReviewJobStatus,
    activeCvReviewJobError,
    onReview,
    onOpenAttempts,
    className,
}: FeedbackSectionProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex items-center gap-2">
                <Label>{t("cv.submission.feedbackTitle")}</Label>
                <StarCiAIBadge />
            </div>
            <Card>
                <CardContent>
                    <MarkdownContent markdown={feedbackMarkdown} />
                </CardContent>
            </Card>
            <div className="flex items-center gap-2">
                <Button
                    size="lg"
                    isDisabled={isReviewDisabled}
                    isPending={isReviewPending}
                    onPress={onReview}
                >
                    {
                        (
                            {
                                isPending,
                            }
                        ) => {
                            return (
                                <>
                                    {isPending ? <Spinner color="current" /> : <ScanIcon aria-hidden className="size-5" />}
                                    <span>
                                        {t(
                                            hasPersistedAiFeedback
                                                ? "cv.submission.reviewActionRerun"
                                                : "cv.submission.reviewAction",
                                        )}
                                    </span>
                                </>
                            )
                        }
                    }
                </Button>
                <Button
                    size="lg"
                    variant="secondary"
                    onPress={onOpenAttempts}
                >
                    {t("cv.submission.attemptsDrawer.openButton")}
                </Button>
            </div>
            {
                activeCvReviewJobId !== undefined && activeCvReviewJobStatus !== undefined ? (
                    <AIProcessingText
                        jobCategory={JobCategory.ReviewCv}
                        jobStatus={activeCvReviewJobStatus}
                        error={activeCvReviewJobError}
                    />
                ) : null
            }
        </div>
    )
}
