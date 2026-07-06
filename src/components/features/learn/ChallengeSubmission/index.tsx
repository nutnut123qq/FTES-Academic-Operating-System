"use client"

import React, { useState } from "react"
import {
    Accordion,
    Chip,
    Drawer,
    Typography,
    cn,
} from "@heroui/react"
import {
    CheckCircleIcon,
    CircleIcon,
    GearIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRouter } from "@/i18n/navigation"
import { useQueryChallengeSubmissionSwr } from "../hooks/useQueryChallengeSubmissionSwr"
import type { SubmissionAttempt } from "../hooks/useQueryChallengeSubmissionSwr"
import { SubmissionRow } from "./SubmissionRow"
import { LastAttemptResult } from "./SubmissionRow/LastAttemptResult"

/**
 * Auto-grading submission surface (StarCI port of `ChallengeSubmissionPanel`). An
 * accordion of graded requirements — each row shows a status icon + score chip in
 * the header, then a URL input, a grader-model picker, Submit + View-attempts, an
 * AI-processing state and the last attempt's result. A settings summary sits on
 * top; "View attempts" opens an attempts-history drawer.
 *
 * Grading is a local mock (fabricated attempts) — a real BE runs the grader over
 * a socket with live job status. The requirements / attempts / feedback model is
 * faithful to StarCI, minus the Formik/Redux/socket/quota wiring.
 */
export const ChallengeSubmission = () => {
    const t = useTranslations("learn")
    const locale = useLocale()
    const router = useRouter()
    const { courseId, challengeId } = useParams<{ courseId: string; challengeId: string }>()
    const { submission, isLoading, error, mutate } = useQueryChallengeSubmissionSwr(courseId, challengeId)

    // session-only attempts appended per requirement on top of the seeded history
    const [localAttempts, setLocalAttempts] = useState<Record<string, Array<SubmissionAttempt>>>({})
    // requirement id whose attempts history the drawer is showing (null = closed)
    const [historyFor, setHistoryFor] = useState<string | null>(null)

    const graders = submission?.graders ?? []
    const activeGrader = graders[0]

    const attemptsOf = (requirementId: string, seeded: Array<SubmissionAttempt>): Array<SubmissionAttempt> => {
        const local = localAttempts[requirementId] ?? []
        // newest first (local attempts are the most recent)
        return [...local, ...seeded].sort((a, b) => b.attemptNumber - a.attemptNumber)
    }

    const latestOf = (requirementId: string, seededLast: SubmissionAttempt | null): SubmissionAttempt | null => {
        const local = localAttempts[requirementId] ?? []
        return local[0] ?? seededLast
    }

    const onSubmitted = (requirementId: string, attempt: SubmissionAttempt) => {
        setLocalAttempts((prev) => ({
            ...prev,
            [requirementId]: [attempt, ...(prev[requirementId] ?? [])],
        }))
    }

    const historyRequirement = submission?.requirements.find((requirement) => requirement.id === historyFor) ?? null

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <AsyncContent
                isLoading={isLoading && !submission}
                skeleton={<SubmissionSkeleton />}
                error={!submission ? error : undefined}
                errorContent={{
                    title: t("submission.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                {submission ? (
                    <>
                        <PageHeader
                            title={submission.title}
                            description={t("submission.subtitle")}
                            actions={(
                                <button
                                    type="button"
                                    className="flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted transition-colors hover:bg-default/60"
                                    onClick={() => router.push(`/courses/${courseId}/learn/content/modules/${challengeId.split("-")[0]}/contents/${challengeId.replace(/-c$/, "")}`)}
                                >
                                    {t("submission.back")}
                                </button>
                            )}
                        />

                        {/* grading-settings summary */}
                        <div className="flex items-center gap-3 rounded-3xl border border-default bg-surface p-4">
                            <GearIcon aria-hidden focusable="false" className="size-5 text-muted" />
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="semibold">
                                    {t("submission.settingsTitle")}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("submission.settingsHint")}
                                </Typography>
                            </div>
                            {activeGrader ? (
                                <Chip size="sm" variant="soft" className="shrink-0">
                                    {t("submission.graderCredits", { grader: activeGrader.label, credits: activeGrader.creditsLabel })}
                                </Chip>
                            ) : null}
                        </div>

                        {/* requirements accordion */}
                        <Accordion
                            variant="surface"
                            className="overflow-hidden border border-default"
                            defaultExpandedKeys={submission.requirements[0] ? [submission.requirements[0].id] : undefined}
                        >
                            {submission.requirements.map((requirement) => {
                                const latest = latestOf(requirement.id, requirement.lastAttempt)
                                const attempted = Boolean(latest && latest.score !== null)
                                const passed = attempted && (latest?.score ?? 0) >= Math.ceil(requirement.score * submission.passThreshold)
                                return (
                                    <Accordion.Item key={requirement.id} id={requirement.id} aria-label={requirement.title}>
                                        <Accordion.Heading>
                                            <Accordion.Trigger className="text-base font-semibold">
                                                <div className="flex w-full min-w-0 items-center justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        {!attempted ? (
                                                            <CircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                                        ) : passed ? (
                                                            <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-5 shrink-0 text-success" />
                                                        ) : (
                                                            <XCircleIcon aria-hidden focusable="false" weight="fill" className="size-5 shrink-0 text-danger" />
                                                        )}
                                                        <Typography type="body" weight="semibold" truncate className="min-w-0 text-left">
                                                            {requirement.sortIndex + 1}. {requirement.title}
                                                        </Typography>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        {attempted ? (
                                                            <Typography type="body-xs" color="muted">
                                                                {t("submission.score", { score: latest?.score ?? 0, total: requirement.score })}
                                                            </Typography>
                                                        ) : (
                                                            <Chip size="sm" variant="soft" color="accent">
                                                                {t("submission.points", { points: requirement.score })}
                                                            </Chip>
                                                        )}
                                                        <Accordion.Indicator />
                                                    </div>
                                                </div>
                                            </Accordion.Trigger>
                                        </Accordion.Heading>
                                        <Accordion.Panel>
                                            <Accordion.Body>
                                                <SubmissionRow
                                                    requirement={requirement}
                                                    passThreshold={submission.passThreshold}
                                                    graders={graders}
                                                    latestAttempt={latest}
                                                    onSubmitted={(attempt) => onSubmitted(requirement.id, attempt)}
                                                    onViewAttempts={() => setHistoryFor(requirement.id)}
                                                />
                                            </Accordion.Body>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                )
                            })}
                        </Accordion>
                    </>
                ) : null}
            </AsyncContent>

            {/* attempts-history drawer */}
            <Drawer.Backdrop isOpen={historyFor !== null} onOpenChange={(next) => { if (!next) { setHistoryFor(null) } }}>
                <Drawer.Content placement="right">
                    <Drawer.Dialog className="flex h-full w-full max-w-md flex-col">
                        <Drawer.CloseTrigger />
                        <Drawer.Header>
                            <Drawer.Heading>{t("submission.history")}</Drawer.Heading>
                        </Drawer.Header>
                        <Drawer.Body className="flex flex-col gap-4">
                            {historyRequirement
                                ? attemptsOf(historyRequirement.id, historyRequirement.attempts).map((attempt) => (
                                    <div key={attempt.id} className="flex flex-col gap-2 rounded-2xl border border-default bg-surface p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <Typography type="body-sm" weight="semibold">
                                                {t("submission.attemptLine", { number: attempt.attemptNumber })}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {new Date(attempt.processedAt).toLocaleString(locale)}
                                            </Typography>
                                        </div>
                                        <Typography type="body-xs" color="muted">
                                            {t("submission.servedBy", { model: attempt.servedModel })}
                                        </Typography>
                                        {attempt.score !== null ? (
                                            <LastAttemptResult
                                                earnedScore={attempt.score}
                                                maxScore={historyRequirement.score}
                                                passThreshold={submission?.passThreshold ?? 0.8}
                                                feedbacks={attempt.feedbacks}
                                                className={cn("mt-0 border-t-0 pt-0")}
                                            />
                                        ) : null}
                                    </div>
                                ))
                                : null}
                            {historyRequirement && attemptsOf(historyRequirement.id, historyRequirement.attempts).length === 0 ? (
                                <Typography type="body-sm" color="muted">
                                    {t("submission.noResult")}
                                </Typography>
                            ) : null}
                        </Drawer.Body>
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer.Backdrop>
        </div>
    )
}

/** Submission skeleton — header + settings + accordion. */
const SubmissionSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-1/2 rounded-large" />
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
    </div>
)
