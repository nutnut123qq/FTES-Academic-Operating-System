"use client"

import React from "react"
import { Button, Spinner, Typography } from "@heroui/react"
import { WarningCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { UseAiToolJobReturn } from "../../hooks/useAiToolJob"

/** Props for {@link AiJobFeedback}. */
export interface AiJobFeedbackProps {
    /** The job orchestrator for this tool. */
    job: UseAiToolJobReturn<unknown>
    /** Re-run the last submit (rebuilds the body from the current form). */
    onRetry: () => void
}

/**
 * Renders the non-result states of a job tool — submitting/running (spinner),
 * quota-exhausted, submit failure, job FAILED, and the soft "taking longer than
 * usual" stale hint — with a retry affordance where useful. Returns `null` once a
 * result is ready (the page renders the result itself) or before the first submit.
 *
 * State priority mirrors {@link useAiToolJob}: quota (most specific) → submit error
 * → job FAILED → busy (+ stale) → nothing.
 */
export const AiJobFeedback = ({ job, onRetry }: AiJobFeedbackProps) => {
    const t = useTranslations("aiPlatform.toolPages.states")
    const { poll } = job

    // Quota exhausted — a distinct, non-alarming message; no job ever started.
    if (job.isQuota) {
        return (
            <ErrorPanel
                message={t("quota")}
                retryLabel={t("retry")}
                onRetry={onRetry}
            />
        )
    }

    // Submit failed (network / envelope) before a job id existed.
    if (job.submitError) {
        return (
            <ErrorPanel
                message={job.submitError.message || t("failed")}
                retryLabel={t("retry")}
                onRetry={onRetry}
            />
        )
    }

    // The job ran and reached FAILED / CANCELLED.
    if (poll.isFailed) {
        return (
            <ErrorPanel
                message={poll.job?.errorMessage || t("failed")}
                retryLabel={t("retry")}
                onRetry={onRetry}
            />
        )
    }

    // Submitting or a job still PENDING/RUNNING.
    if (job.isBusy) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-8 text-center">
                <Spinner size="lg" />
                <Typography type="body-sm" color="muted">
                    {t("running")}
                </Typography>
                {poll.isStale ? (
                    <div className="flex flex-col items-center gap-2">
                        <Typography type="body-xs" color="muted">
                            {t("stale")}
                        </Typography>
                        <Button size="sm" variant="tertiary" onPress={() => poll.refresh()}>
                            {t("retry")}
                        </Button>
                    </div>
                ) : null}
            </div>
        )
    }

    return null
}

/** A boxed error/quota panel with a retry button. */
const ErrorPanel = ({
    message,
    retryLabel,
    onRetry,
}: {
    message: string
    retryLabel: string
    onRetry: () => void
}) => (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-8 text-center">
        <WarningCircleIcon aria-hidden focusable="false" className="size-8 text-danger" />
        <Typography type="body-sm" color="muted">
            {message}
        </Typography>
        <Button size="sm" variant="secondary" onPress={onRetry}>
            {retryLabel}
        </Button>
    </div>
)
