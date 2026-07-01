"use client"

import React from "react"
import {
    cn,
    Link,
    ScrollShadow,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useAppSelector } from "@/redux/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Detail half of the CV-attempts drawer master-detail: the full AI analysis for the selected
 * attempt. Replaces the former `CvSubmissionAttemptAnalysisModal` that opened OVER the drawer —
 * now swapped in-place so there is no modal-over-drawer. Reads the selected attempt from redux;
 * rendered by {@link import("../index").UserCvSubmissionAttemptsDrawer} when a selection is set.
 *
 * @param props.className - Optional wrapper class.
 */
export const CvAttemptAnalysisView = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations()
    const selectedAttempt = useAppSelector(
        (state) => state.cvSubmissionAttemptAnalysis.selectedAttempt,
    )
    const markdown = selectedAttempt?.detailFeedback?.trim()
        || t("cv.submission.attemptAnalysis.empty")

    return (
        <div className={cn("flex min-h-0 flex-1 flex-col p-3", className)}>
            {selectedAttempt ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-default-50 p-3">
                    <div className="min-w-0">
                        <div className="text-xs text-muted">
                            {t("cv.submission.attempts.file")}
                        </div>
                        <div className="truncate text-sm font-medium">
                            {selectedAttempt.fileLabel}
                        </div>
                    </div>
                    {selectedAttempt.fileUrlIsPublic ? (
                        <Link
                            className="inline-flex h-8 items-center justify-center rounded-medium bg-default-100 px-3 text-sm font-medium text-foreground no-underline hover:opacity-90"
                            href={selectedAttempt.fileUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {t("cv.submission.attemptAnalysis.openFile")}
                        </Link>
                    ) : null}
                </div>
            ) : null}
            <ScrollShadow
                className="min-h-0 flex-1 rounded-2xl bg-surface p-4 text-sm"
                hideScrollBar
            >
                <MarkdownContent markdown={markdown} />
            </ScrollShadow>
        </div>
    )
}
