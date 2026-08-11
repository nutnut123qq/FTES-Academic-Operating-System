"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Chip, Typography, cn, toast } from "@heroui/react"
import { ArrowLeftIcon } from "@phosphor-icons/react"
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
import { PePaperCommentThread } from "./PePaperCommentThread"
import { PePaperPane } from "./PePaperPane"
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
 * PE (Practical Exam) paper page: read the exam sheet on the LEFT, hand in an answer file
 * and watch the AI grade land on the RIGHT.
 *
 * The two-pane frame is the FE album's, on purpose — same
 * `lg:grid-cols-[minmax(0,1fr)_400px]` box, same black paper pane, same right column on
 * `bg-overlay` scrolling on its own, same stack below `lg:` (paper first, then the submit
 * column). The two practice surfaces are one system, and the picture branch is literally
 * the same component ({@link ExamImageViewer} via {@link PePaperPane}).
 *
 * The row is pinned to `minmax(0,1fr)` and the panes carry `min-h-0` for the reason
 * spelled out in the viewer: a grid item's automatic minimum size is its CONTENT, so a
 * portrait scan (or a long attempt list) would otherwise inflate the row past the frame's
 * height and get clipped.
 *
 * What the paper looks like per file type — picture / PDF / neither — is
 * {@link PePaperPane}'s job.
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
        <div className="flex flex-col gap-3 p-6">
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

            <AsyncContent
                isLoading={isLoadingResource && !resource}
                skeleton={<PePaperSkeleton />}
                error={!resource ? resourceError : undefined}
                errorContent={{
                    title: t("practice.pe.loadError"),
                    onRetry: () => {
                        void mutateResource()
                    },
                    retryLabel: t("practice.exam.retry"),
                }}
            >
                {/* Same frame as the FE album, down to the 20rem of workspace chrome the
                    height leaves room for (4rem navbar + the subject cover + identity row). */}
                <div className="overflow-hidden rounded-2xl border border-separator lg:grid lg:h-[calc(100dvh-20rem)] lg:min-h-[26rem] lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(0,1fr)]">
                    {/* LEFT — the exam paper (picture / PDF / not-previewable) */}
                    <div className="flex h-[60dvh] min-h-0 flex-col bg-default lg:h-full">
                        <PePaperPane
                            resourceId={paperId}
                            facts={paperSwr.data ?? null}
                            isLoading={!paperSwr.data && !paperSwr.error}
                            onDownload={() => {
                                void onDownload()
                            }}
                            isDownloading={downloading}
                        />
                    </div>

                    {/* RIGHT — the brief, the answer upload, the attempts, the discussion
                        (scrolls on its own on lg:) */}
                    <div className="flex min-h-0 flex-col gap-4 bg-overlay p-4 lg:overflow-y-auto">
                        {resource?.description ? (
                            <MarkdownContent markdown={resource.description} />
                        ) : null}

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

                        {/* discussion — the RESOURCE-level C-4 thread, the same one
                            `/resources/{paperId}` shows. PE has no thread of its own. */}
                        <PePaperCommentThread resourceId={paperId} />
                    </div>
                </div>
            </AsyncContent>
        </div>
    )
}

/** Loading skeleton — mirrors the two-pane frame so the layout never jumps. */
const PePaperSkeleton = () => (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-[60dvh] w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
    </div>
)
