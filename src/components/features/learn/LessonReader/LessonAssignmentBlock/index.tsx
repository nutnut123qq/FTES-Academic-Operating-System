"use client"

import React, { useState } from "react"
import { Button, Chip, Input, TextField, Typography, cn } from "@heroui/react"
import { ClipboardTextIcon, LockSimpleIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useRestWithToast } from "@/modules/toast/hooks"
import {
    isSubmissionPending,
    useGetMyAssignmentSubmissionsSwr,
} from "@/hooks/swr/api/rest/queries/useGetMyAssignmentSubmissionsSwr"
import { useGetLessonAssignmentsSwr } from "@/hooks/swr/api/rest/queries/useGetLessonAssignmentsSwr"
import { usePostSubmitAssignmentSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitAssignmentSwr"
import type { AssignmentView, CourseSubmissionView } from "@/modules/api/rest/course"

/** Props for {@link LessonAssignmentBlock}. */
export interface LessonAssignmentBlockProps {
    /** The lesson (route `contentId`) whose assignments to load. */
    lessonId: string
    /** Extra classes on the section root (e.g. the reading-width cap). */
    className?: string
}

/** Mirror of the BE `@Pattern("^https://.+")` guard on `githubSubmissionUrl`. */
const isHttpsUrl = (value: string): boolean => /^https:\/\/.+/.test(value.trim())

/**
 * Assignment block for the lesson reader. Loads the lesson's assignments and, when
 * the list is non-empty, renders one card per assignment: the prompt (markdown), a
 * GitHub-URL submit form (client-side `https://` validation mirroring the BE), and
 * the learner's grading history. Renders nothing while loading / on error / when the
 * lesson has no assignments (the common case), so it never adds empty chrome.
 */
export const LessonAssignmentBlock = ({ lessonId, className }: LessonAssignmentBlockProps) => {
    const t = useTranslations("learn")
    const { data: assignments } = useGetLessonAssignmentsSwr(lessonId)

    // Only surface the block once we have a real, non-empty list — no skeleton on the
    // (majority) lessons that carry no assignment, and silence on a 401/403/empty.
    if (!assignments || assignments.length === 0) {
        return null
    }

    return (
        <section className={cn("flex flex-col gap-4", className)}>
            <div className="flex items-center gap-2">
                <ClipboardTextIcon aria-hidden focusable="false" className="size-5 text-accent" />
                <Typography type="body" weight="semibold">
                    {t("exercises.assignment.title")}
                </Typography>
            </div>
            <div className="flex flex-col gap-4">
                {assignments.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
            </div>
        </section>
    )
}

/** One assignment: prompt, submit form, submission history. */
const AssignmentCard = ({ assignment }: { assignment: AssignmentView }) => {
    const t = useTranslations("learn")
    const locale = useLocale()
    const runRest = useRestWithToast()
    const submissionsSwr = useGetMyAssignmentSubmissionsSwr(assignment.id)
    const submit = usePostSubmitAssignmentSwr()

    const [url, setUrl] = useState("")
    const [touched, setTouched] = useState(false)

    const submissions = submissionsSwr.data ?? []
    const usedCount = submissions.length
    const reachedMax = usedCount >= assignment.maxSubmissions
    const invalid = url.trim() !== "" && !isHttpsUrl(url)
    const canSubmit = !reachedMax && isHttpsUrl(url) && !submit.isMutating

    // newest attempt first
    const history = [...submissions].sort((a, b) => b.submissionAttempt - a.submissionAttempt)

    const handleSubmit = async () => {
        setTouched(true)
        // Client-side gate — never fire the request for a non-https URL (spec scenario).
        if (!isHttpsUrl(url) || reachedMax || submit.isMutating) {
            return
        }
        const ok = await runRest(
            () => submit.trigger({ assignmentId: assignment.id, request: { githubSubmissionUrl: url.trim() } }),
            { successMessage: t("exercises.assignment.submitted") },
        )
        if (ok !== null) {
            setUrl("")
            setTouched(false)
            void submissionsSwr.mutate()
        }
    }

    return (
        <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <Typography type="body" weight="semibold" className="min-w-0">
                    {assignment.title}
                </Typography>
                <Chip size="sm" variant="soft" className="shrink-0">
                    {t("exercises.assignment.submissionsCount", {
                        used: usedCount,
                        max: assignment.maxSubmissions,
                    })}
                </Chip>
            </div>

            {assignment.question ? (
                <div className="text-sm">
                    <MarkdownContent reading markdown={assignment.question} />
                </div>
            ) : null}

            {/* submit form — locked once the learner has used every attempt */}
            {reachedMax ? (
                <div className="flex items-center gap-2 rounded-2xl border border-default bg-default/40 p-4">
                    <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                    <Typography type="body-sm" color="muted">
                        {t("exercises.assignment.maxReached", { max: assignment.maxSubmissions })}
                    </Typography>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("exercises.assignment.urlLabel")}
                    </Typography>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                        <TextField variant="secondary" className="w-full" isInvalid={touched && invalid}>
                            <Input
                                variant="secondary"
                                type="url"
                                inputMode="url"
                                value={url}
                                onChange={(event) => setUrl(event.target.value)}
                                onBlur={() => setTouched(true)}
                                placeholder={t("exercises.assignment.urlPlaceholder")}
                                aria-label={t("exercises.assignment.urlLabel")}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault()
                                        void handleSubmit()
                                    }
                                }}
                            />
                        </TextField>
                        <Button
                            variant="primary"
                            className="shrink-0"
                            isPending={submit.isMutating}
                            isDisabled={!canSubmit}
                            onPress={() => void handleSubmit()}
                        >
                            {t("exercises.assignment.submit")}
                        </Button>
                    </div>
                    {touched && invalid ? (
                        <Typography type="body-xs" className="text-danger">
                            {t("exercises.assignment.urlInvalid")}
                        </Typography>
                    ) : null}
                </div>
            )}

            {/* grading history */}
            {history.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-default pt-4">
                    <Typography type="body-sm" weight="semibold">
                        {t("exercises.assignment.historyTitle")}
                    </Typography>
                    {history.map((submission) => (
                        <SubmissionRow key={submission.id} submission={submission} locale={locale} />
                    ))}
                </div>
            ) : null}
        </div>
    )
}

/** One row in the grading history — attempt, status, AI score + evaluation. */
const SubmissionRow = ({
    submission,
    locale,
}: {
    submission: CourseSubmissionView
    locale: string
}) => {
    const t = useTranslations("learn")
    const pending = isSubmissionPending(submission)
    const graded = submission.status === "GRADED"
    const failed = submission.status === "FAILED"

    const statusColor = pending ? undefined : graded ? "success" : failed ? "danger" : undefined
    const statusLabel = t(`exercises.assignment.status.${
        pending ? (submission.status === "GRADING" ? "grading" : "submitted") : graded ? "graded" : "failed"
    }`)

    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-default bg-default/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("exercises.assignment.attemptLine", { number: submission.submissionAttempt })}
                    </Typography>
                    <Chip size="sm" variant="soft" color={statusColor}>
                        {statusLabel}
                    </Chip>
                    {graded && submission.aiScore !== null ? (
                        <Chip size="sm" variant="soft" color="accent">
                            {t("exercises.assignment.aiScore", { score: submission.aiScore })}
                        </Chip>
                    ) : null}
                </div>
                <Typography type="body-xs" color="muted">
                    {new Date(submission.submittedAt).toLocaleString(locale)}
                </Typography>
            </div>
            {pending ? (
                <Typography type="body-xs" color="muted">
                    {t("exercises.assignment.pendingHint")}
                </Typography>
            ) : submission.evaluation ? (
                <Typography type="body-sm" color="muted" className="whitespace-pre-wrap">
                    {submission.evaluation}
                </Typography>
            ) : null}
        </div>
    )
}
