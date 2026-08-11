"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Chip, Typography, cn, toast } from "@heroui/react"
import { ArrowLeftIcon, DownloadSimpleIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"

import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { useQueryResourceDetailSwr } from "@/components/features/resource/hooks/useQueryResourceDetailSwr"
import { useQueryPeSubmissionsSwr } from "@/components/features/resource/hooks/useQueryPeSubmissionsSwr"
import { RestError } from "@/modules/api/rest/client"
import { downloadResourceFile } from "@/modules/api/rest/resource"
import type { PeSubmissionView } from "@/modules/api/rest/resource"
import { PeAnswerForm } from "./PeAnswerForm"
import { PeAttemptResult } from "./PeAttemptResult"
import { classifyPeSubmitError } from "./peErrors"
import { useQueryPePaperSwr } from "./useQueryPePaperSwr"

/** Attempt status → chip tone. */
const STATUS_COLOR: Record<
    PeSubmissionView["status"],
    "success" | "warning" | "danger" | "accent"
> = {
    PENDING: "warning",
    GRADING: "warning",
    SCORED: "success",
    FAILED: "danger",
}

/**
 * PE (Practical Exam) paper page: read the exam sheet, hand in an answer file, watch the
 * AI grade land.
 *
 * The paper renders inline when it is a picture (the storage provider serves images
 * directly); a PDF/zip is offered as a BE-streamed download instead, because the
 * provider refuses direct delivery of its `raw` bucket.
 *
 * Grading is asynchronous: the submit answers `GRADING` and
 * `useQueryPeSubmissionsSwr` polls until every attempt has settled, so the attempt list
 * moves from "đang chấm" to a score without the student reloading. Selecting a `SCORED`
 * attempt renders its grade through the shared {@link GradeResultCard}.
 *
 * A real route (`/subjects/{id}/practice/pe/{paperId}`), so a paper is linkable and the
 * workspace rail keeps "Practice" highlighted.
 */
export const SubjectPePaper = () => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const router = useRouter()
    const { subjectId, paperId } = useParams<{ subjectId: string; paperId: string }>()

    const { resource, isLoading: isLoadingResource, error: resourceError, mutate: mutateResource } =
        useQueryResourceDetailSwr(paperId)
    const paperSwr = useQueryPePaperSwr(paperId, resource?.currentVersionId)
    const submissionsSwr = useQueryPeSubmissionsSwr(paperId)
    const [downloading, setDownloading] = useState(false)
    /** The attempt whose grade is expanded; defaults to the newest scored one. */
    const [openAttemptId, setOpenAttemptId] = useState<string | null>(null)

    const submissions = submissionsSwr.data?.items ?? []
    const attemptsUsed = submissionsSwr.data?.attemptsUsed ?? 0
    const maxAttempts = submissionsSwr.data?.maxAttempts ?? 0
    const isGrading = submissions.some(
        (submission) => submission.status === "PENDING" || submission.status === "GRADING",
    )

    // Open the newest scored attempt by default, and re-open the fresh one the moment a
    // grade lands — the student's own submit is the reason they are on this page.
    useEffect(() => {
        if (openAttemptId !== null) {
            return
        }
        const scored = submissions
            .filter((submission) => submission.status === "SCORED")
            .sort((left, right) => right.attemptNo - left.attemptNo)[0]
        if (scored) {
            setOpenAttemptId(scored.id)
        }
    }, [submissions, openAttemptId])

    const onDownload = useCallback(async () => {
        setDownloading(true)
        try {
            await downloadResourceFile(paperId)
        } catch (error) {
            const status = error instanceof RestError ? error.status : 0
            toast.danger(
                status === 401
                    ? t("practice.pe.errors.unauthorized")
                    : t(`practice.pe.errors.${classifyPeSubmitError(error)}`),
            )
        } finally {
            setDownloading(false)
        }
    }, [paperId, t])

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start gap-3">
                <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => router.push(`/subjects/${subjectId}/practice`)}
                >
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.pe.backToList")}
                </Button>
                <div className="min-w-0 flex-1">
                    <Typography type="h5" weight="bold" truncate>
                        {resource?.title ?? t("practice.pe.title")}
                    </Typography>
                    {resource?.createdAt ? (
                        <Typography type="body-sm" color="muted">
                            {formatRelativeTime(resource.createdAt, locale)}
                        </Typography>
                    ) : null}
                </div>
            </div>

            {/* the exam paper */}
            <AsyncContent
                isLoading={isLoadingResource && !resource}
                skeleton={<Skeleton className="h-64 w-full rounded-2xl" />}
                error={!resource ? resourceError : undefined}
                errorContent={{
                    title: t("practice.pe.loadError"),
                    onRetry: () => {
                        void mutateResource()
                    },
                    retryLabel: t("practice.exam.retry"),
                }}
            >
                <section className="flex flex-col gap-3">
                    {resource?.description ? (
                        <MarkdownContent markdown={resource.description} />
                    ) : null}

                    {paperSwr.data?.imageUrl ? (
                        // A picture of the exam sheet — rendered inline. Plain <img>: the
                        // URL is a remote provider host next/image would need whitelisting for.
                        <img
                            src={paperSwr.data.imageUrl}
                            alt={t("practice.pe.paperAlt")}
                            className="max-h-[70vh] w-full rounded-2xl border border-separator object-contain"
                        />
                    ) : (
                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-separator p-4">
                            <Typography
                                type="body-sm"
                                color="muted"
                                className="min-w-0 flex-1"
                                truncate
                            >
                                {paperSwr.data?.originalFilename ?? t("practice.pe.paperFile")}
                            </Typography>
                            <Button
                                size="sm"
                                variant="secondary"
                                isPending={downloading}
                                isDisabled={downloading}
                                onPress={() => {
                                    void onDownload()
                                }}
                            >
                                <DownloadSimpleIcon
                                    aria-hidden
                                    focusable="false"
                                    className="size-4"
                                />
                                {t("practice.pe.openPaper")}
                            </Button>
                        </div>
                    )}
                </section>
            </AsyncContent>

            {/* answer upload */}
            <PeAnswerForm
                resourceId={paperId}
                attemptsUsed={attemptsUsed}
                maxAttempts={maxAttempts}
                isGrading={isGrading}
                onSubmitted={() => {
                    // Show the grade of the attempt just filed once it settles.
                    setOpenAttemptId(null)
                    void submissionsSwr.mutate()
                }}
            />

            {/* attempts + the AI grade */}
            <section className="flex flex-col gap-3">
                <Typography type="body" weight="semibold">
                    {t("practice.pe.attemptsTitle")}
                </Typography>
                <AsyncContent
                    isLoading={!submissionsSwr.data && !submissionsSwr.error}
                    skeleton={
                        <div className="flex flex-col gap-2">
                            {[0, 1].map((row) => (
                                <Skeleton key={row} className="h-14 w-full rounded-2xl" />
                            ))}
                        </div>
                    }
                    isEmpty={submissions.length === 0}
                    emptyContent={{ title: t("practice.pe.noAttempts") }}
                    error={!submissionsSwr.data ? submissionsSwr.error : undefined}
                    errorContent={{
                        title: t("practice.pe.attemptsError"),
                        onRetry: () => {
                            void submissionsSwr.mutate()
                        },
                        retryLabel: t("practice.exam.retry"),
                    }}
                >
                    <div className="flex flex-col gap-3">
                        {submissions.map((submission) => (
                            <div key={submission.id} className="flex flex-col gap-3">
                                <div
                                    className={cn(
                                        "flex flex-wrap items-center gap-3 rounded-2xl border p-4",
                                        openAttemptId === submission.id
                                            ? "border-accent/50 bg-accent/5"
                                            : "border-separator",
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <Typography type="body-sm" weight="medium">
                                            {t("practice.pe.attemptNo", {
                                                attempt: submission.attemptNo,
                                            })}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {[
                                                submission.originalFilename,
                                                formatRelativeTime(
                                                    submission.submittedAt,
                                                    locale,
                                                ),
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </Typography>
                                    </div>
                                    {typeof submission.finalScore === "number" ||
                                    typeof submission.autoScore === "number" ? (
                                            <Typography type="body-sm" weight="semibold">
                                                {submission.finalScore ?? submission.autoScore}
                                            </Typography>
                                        ) : null}
                                    <Chip
                                        size="sm"
                                        variant="soft"
                                        color={STATUS_COLOR[submission.status]}
                                    >
                                        {t(`practice.pe.status.${submission.status}`)}
                                    </Chip>
                                    {submission.status === "SCORED" ? (
                                        <Button
                                            size="sm"
                                            variant="tertiary"
                                            onPress={() =>
                                                setOpenAttemptId(
                                                    openAttemptId === submission.id
                                                        ? null
                                                        : submission.id,
                                                )
                                            }
                                        >
                                            {openAttemptId === submission.id
                                                ? t("practice.pe.hideResult")
                                                : t("practice.pe.viewResult")}
                                        </Button>
                                    ) : null}
                                </div>

                                {submission.status === "FAILED" && submission.failureReason ? (
                                    <Typography type="body-xs" className="text-danger">
                                        {submission.failureReason}
                                    </Typography>
                                ) : null}

                                {submission.status === "SCORED" &&
                                openAttemptId === submission.id ? (
                                        <PeAttemptResult
                                            resourceId={paperId}
                                            submissionId={submission.id}
                                        />
                                    ) : null}
                            </div>
                        ))}
                    </div>
                </AsyncContent>
            </section>
        </div>
    )
}
