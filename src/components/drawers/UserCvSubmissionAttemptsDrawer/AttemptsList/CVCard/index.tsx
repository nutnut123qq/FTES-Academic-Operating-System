"use client"

import { Clock as ClockIcon, FileText as FilePdfIcon } from "@gravity-ui/icons"
import React, {
    useCallback,
} from "react"
import {
    Button,
    cn,
    Link,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { useAppDispatch } from "@/redux/hooks"
import { setSelectedCvSubmissionAttemptAnalysis } from "@/redux/slices/cv-submission-attempt-analysis"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CVCard}. */
export interface CVCardProps extends WithClassNames<undefined> {
    /** Unique key/id for the CV submission attempt. */
    attemptId: string
    /** Human-visible attempt number. */
    attemptNumber: number
    /** Display label for the uploaded CV file. */
    fileLabel: string
    /** Public or signed URL for opening the CV file. */
    fileUrl: string
    /** Whether the file URL can be opened directly. */
    fileUrlIsPublic: boolean
    /** Formatted submitted timestamp. */
    submittedAtLabel: string
    /** Processing/review status from the API. */
    status: string
    /** Short preview of the AI feedback. */
    feedbackPreview: string
    /** Full AI feedback markdown for the analysis modal. */
    detailFeedback: string
}

/**
 * Card row for one uploaded CV attempt in the attempts drawer.
 *
 * @param props - Attempt display data; self-dispatches to open the analysis modal.
 */
export const CVCard = (props: CVCardProps) => {
    const {
        attemptId,
        attemptNumber,
        fileLabel,
        fileUrl,
        fileUrlIsPublic,
        submittedAtLabel,
        status,
        feedbackPreview,
        detailFeedback,
        className,
    } = props
    const t = useTranslations()
    const dispatch = useAppDispatch()

    /** Select this attempt — the drawer swaps to its analysis detail (master-detail). */
    const onPress = useCallback(
        () => {
            dispatch(setSelectedCvSubmissionAttemptAnalysis({
                attemptId,
                attemptNumber,
                fileLabel,
                fileUrl,
                fileUrlIsPublic,
                submittedAtLabel,
                status,
                detailFeedback,
            }))
        },
        [
            attemptId,
            attemptNumber,
            fileLabel,
            fileUrl,
            fileUrlIsPublic,
            submittedAtLabel,
            status,
            detailFeedback,
            dispatch,
        ],
    )

    return (
        <article className={cn("rounded-3xl border border-divider/70 bg-content1 p-4 shadow-sm transition hover:border-accent/50 hover:bg-accent/5", className)}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-accent">
                        {t("cv.submission.attemptsDrawer.attemptLine", {
                            number: attemptNumber,
                        })}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <FilePdfIcon
                            className="shrink-0 text-danger"
                            width={20} height={20}
                        />
                        {
                            fileUrlIsPublic ? (
                                <Link
                                    className="min-w-0 truncate text-sm font-medium text-foreground underline"
                                    href={fileUrl}
                                    target="_blank"
                                >
                                    {fileLabel}
                                </Link>
                            ) : (
                                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                                    {fileLabel}
                                </span>
                            )
                        }
                    </div>
                </div>
                <span className="shrink-0 rounded-full bg-default-100 px-2.5 py-1 text-xs font-medium text-muted">
                    {status}
                </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                <ClockIcon width={14} height={14} />
                <span>{submittedAtLabel}</span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                {feedbackPreview}
            </p>
            <div className="mt-4 flex justify-end">
                <Button
                    size="sm"
                    variant="secondary"
                    onPress={onPress}
                >
                    {t("cv.submission.attempts.viewDetails")}
                </Button>
            </div>
        </article>
    )
}
