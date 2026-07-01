"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react"
import { Accordion, Chip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, CircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { FormikErrors, FormikTouched } from "formik"
import _ from "lodash"
import type {
    ChallengeGradeSelection,
    ChallengeSubmissionRowViewModel,
} from "./types"
import { SUBMISSION_ICON_MAP } from "./map"
import { AUTO_GRADE_SELECTION, resolveInitialGradeSelection } from "./utils"
import { SubmissionRow } from "./SubmissionRow"
import { PublicationEvent } from "@/hooks/socketio/enums/publication-event"
import { useAiQuotaOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useEditSubmissionForm } from "@/hooks/rhf/useEditSubmissionForm"
import { useJobNotificationsSocketIo } from "@/hooks/socketio/useJobNotificationsSocketIo"
import { useMutateSubmitChallengeSubmissionSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSubmitChallengeSubmissionSwr"
import { useMutateSyncChallengeSubmissionSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSyncChallengeSubmissionSwr"
import { useQueryAiModelsSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiModelsSwr"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import { useQueryMyCreditUsageSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyCreditUsageSwr"
import type { AiGradableModel } from "@/modules/api/graphql/queries/types/ai-models"
import { ChallengeSubmissionEntity } from "@/modules/types/entities/challenge-submission"
import { JobCategory } from "@/modules/types/enums/job-category"
import { JobStatus } from "@/modules/types/enums/job-status"
import { UserChallengeSubmissionEntity } from "@/modules/types/entities/user-challenge-submission"
import { WithClassNames } from "@/modules/types/base/class-name"
import { setChallengeSubmissionJobId } from "@/redux/slices/challenge"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { resolveChallengeSubmissionJobEnvelope } from "@/components/utils/challenge-submission-job"

/** Props for {@link ChallengeSubmissionPanel} — state comes from Formik and Redux. */
type ChallengeSubmissionPanelProps = WithClassNames<undefined> & {
    /** SCHEMA V2: active programming language to submit with (selects the approach-criteria bucket). */
    lang?: string
}

/**
 * Left-column container of the challenge surface: a grading-lane selector plus an inline
 * form per challenge requirement (URL input, job status, submit and history actions).
 *
 * Container: owns Formik form state, SWR data, Redux job/loading state and the socket
 * subscription, derives one view-model per row, and pushes `onXXX` handlers down to the
 * presentational {@link SubmissionRow} children. Marked `"use client"` for hooks/state.
 * @param props - Class names for the component.
 */
export const ChallengeSubmissionPanel = (props: ChallengeSubmissionPanelProps) => {
    const { className, lang } = props
    const formik = useEditSubmissionForm()
    const {
        values,
        errors,
        touched,
        setFieldValue,
        setFieldTouched,
        isSubmitting,
        autosaveStatus,
    } = formik
    const t = useTranslations()
    // Inline auto-save status text for the debounced submission sync.
    const tAutosave = useTranslations("autosave")
    const runGraphQL = useGraphQLWithToast()
    const submitChallengeSubmissionSwr = useMutateSubmitChallengeSubmissionSwr()
    const syncSubmissionSwr = useMutateSyncChallengeSubmissionSwr()
    const dispatch = useAppDispatch()
    const loadingChallengeSubmissionIds = useAppSelector(
        (state) => state.challenge.loadingChallengeSubmissionIds,
    )
    const submissionIdToJobId = useAppSelector((state) => state.challenge.submissionIdToJobId)
    const aiProcessingData = useAppSelector((state) => state.modal.aiProcessingData)
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    // Credit usage snapshot (source of truth: credit_usage_histories), Redis-cached.
    const creditUsageSwr = useQueryMyCreditUsageSwr()
    const creditUsage = creditUsageSwr.data
    // AI usage details live in the AiQuota modal; the panel only links into it.
    const { open: openAiQuota } = useAiQuotaOverlayState()
    // Route to the AI subscription page so the user can top up their quota.
    const onAddQuota = useCallback(
        () => {
            router.push(`/${locale}/profile/settings/ai-subscription`)
        },
        [
            router,
            locale,
        ],
    )
    const jobNotificationsSocket = useJobNotificationsSocketIo()
    const jobStatusByJobId = useAppSelector((state) => state.socketIo.jobStatusByJobId)

    const config = useAppSelector((state) => state.system.config)
    const passThreshold = config?.challenge?.passThreshold ?? 0

    // grading lane + model the user picks per row; premium models gated by entitlement
    const myAiSettingsSwr = useQueryMyAiSettingsSwr()
    const aiSettings = myAiSettingsSwr.data
    const aiModelsSwr = useQueryAiModelsSwr()
    const canPremium = Boolean(aiSettings?.canPremium)

    /** Enabled models the grading dropdown can offer. */
    const gradableModels = useMemo<Array<AiGradableModel>>(
        () => aiModelsSwr.data?.aiModels?.data?.gradableModels ?? [],
        [
            aiModelsSwr.data,
        ],
    )

    /** Per-row grading-lane + model selection, keyed by submission id. */
    const [selectionBySubmissionId, setSelectionBySubmissionId] =
        useState<Record<string, ChallengeGradeSelection>>({})

    /** Submissions sorted by their requirement order. */
    const sortedSubmissions = useMemo(
        () => _.cloneDeep(values.submissions ?? []).sort((prev, next) => prev.sortIndex - next.sortIndex),
        [
            values.submissions,
        ],
    )

    /** Active AI-processing job id for the challenge-submit flow, from the modal state. */
    const modalJobId = useMemo(
        () => aiProcessingData?.category === JobCategory.SubmitChallenge
            ? aiProcessingData.jobId
            : undefined,
        [
            aiProcessingData,
        ],
    )

    /** One ready-to-render view-model per submission row. */
    const rows = useMemo<Array<ChallengeSubmissionRowViewModel>>(
        () => sortedSubmissions
            .map<ChallengeSubmissionRowViewModel | null>((submission) => {
                const index = values.submissions?.findIndex(
                    (candidate) => candidate.id === submission.id,
                ) ?? -1
                if (index < 0) {
                    return null
                }
                const errorMessage = (
                    (errors.submissions?.[index] as unknown as FormikErrors<ChallengeSubmissionEntity>)
                        ?.userSubmission as unknown as FormikErrors<UserChallengeSubmissionEntity>
                )?.submissionUrl
                const isTouched = !!(
                    (touched.submissions?.[index] as unknown as FormikTouched<ChallengeSubmissionEntity>)
                        ?.userSubmission as unknown as FormikTouched<UserChallengeSubmissionEntity>
                )?.submissionUrl
                const jobEnvelope = resolveChallengeSubmissionJobEnvelope(
                    submission.id,
                    submissionIdToJobId,
                    jobStatusByJobId,
                )
                const rowJobStatus = jobEnvelope?.data?.status
                const rowSubmitJobId = submissionIdToJobId[submission.id]
                const activeJobId = modalJobId && rowSubmitJobId && modalJobId === rowSubmitJobId
                    ? modalJobId
                    : undefined
                const activeJobStatus = activeJobId
                    ? jobStatusByJobId[activeJobId]?.data?.status
                    : undefined
                const activeJobError = activeJobId
                    ? jobStatusByJobId[activeJobId]?.data?.error
                    : undefined
                const isBusy = rowJobStatus === JobStatus.Queued
                    || rowJobStatus === JobStatus.Processing
                return {
                    submission,
                    index,
                    fieldName: `submissions.${index}.userSubmission.submissionUrl`,
                    inputId: `challenge-submission-url-${submission.id}`,
                    urlValue: values.submissions?.[index]?.userSubmission?.submissionUrl ?? "",
                    iconComponent: SUBMISSION_ICON_MAP[submission.type],
                    errorMessage: typeof errorMessage === "string" ? errorMessage : undefined,
                    isTouched,
                    rowJobStatus,
                    isPending: isSubmitting || isBusy,
                    isInputDisabled: isBusy,
                    isLoading: loadingChallengeSubmissionIds.includes(submission.id),
                    activeJobStatus,
                    activeJobError,
                    showActiveJob: activeJobId !== undefined && activeJobStatus !== undefined,
                    lastAttemptScore: submission.userSubmission?.lastAttempt?.score ?? undefined,
                    maxScore: submission.score ?? 0,
                }
            })
            .filter((row): row is ChallengeSubmissionRowViewModel => row !== null),
        [
            sortedSubmissions,
            values.submissions,
            errors.submissions,
            touched.submissions,
            submissionIdToJobId,
            jobStatusByJobId,
            modalJobId,
            isSubmitting,
            loadingChallengeSubmissionIds,
        ],
    )

    // seed each row's selection once its data + the model catalog are available:
    // restore the persisted pick if any, otherwise default to a premium model
    useEffect(() => {
        const submissions = values.submissions ?? []
        if (submissions.length === 0) {
            return
        }
        setSelectionBySubmissionId((prev) => {
            let changed = false
            const next = { ...prev }
            for (const submission of submissions) {
                if (next[submission.id]) {
                    continue
                }
                next[submission.id] = resolveInitialGradeSelection(
                    submission.userSubmission,
                    gradableModels,
                    canPremium,
                )
                changed = true
            }
            return changed ? next : prev
        })
    }, [
        values.submissions,
        gradableModels,
        canPremium,
    ])

    /**
     * Update one row's grading-lane + model selection and sync it to the
     * backend (upserts the user submission row, creating it if missing). URL is
     * intentionally omitted so this never trips URL validation.
     */
    const onSelectGrade = useCallback(
        (submissionId: string, selection: ChallengeGradeSelection) => {
            setSelectionBySubmissionId((prev) => ({
                ...prev,
                [submissionId]: selection,
            }))
            void runGraphQL(
                async () => {
                    const response = await syncSubmissionSwr.trigger({
                        id: submissionId,
                        selectedMode: selection.mode,
                        selectedModel: selection.model ?? undefined,
                        selectedModelProvider: selection.provider ?? undefined,
                    })
                    const result = response.data?.syncSubmission
                    if (!result?.success) {
                        throw new Error(response.error?.message)
                    }
                    return result
                },
                {
                    showSuccessToast: false,
                    showErrorToast: true,
                },
            )
        },
        [
            syncSubmissionSwr,
            runGraphQL,
        ],
    )

    const onChangeUrl = useCallback(
        (fieldName: string, value: string) => {
            setFieldValue(fieldName, value)
        },
        [
            setFieldValue,
        ],
    )

    const onBlurUrl = useCallback(
        (fieldName: string) => {
            setFieldTouched(fieldName, true)
        },
        [
            setFieldTouched,
        ],
    )

    /** Submit a single row's URL for grading and subscribe to its job notifications. */
    const onSubmit = useCallback(
        async (submissionId: string, index: number) => {
            // hard guard: never submit without a URL (the button is also disabled on an
            // empty/invalid url, and the backend throws — this is the belt-and-suspenders).
            const url = values.submissions?.[index]?.userSubmission?.submissionUrl?.trim()
            if (!url) {
                setFieldTouched(`submissions.${index}.userSubmission.submissionUrl`)
                return
            }
            await runGraphQL(
                async () => {
                    // call the submit mutation with the typed URL + this row's
                    // chosen grading lane + model
                    const selection = selectionBySubmissionId[submissionId]
                    const response = await submitChallengeSubmissionSwr.trigger({
                        challengeSubmissionId: submissionId,
                        githubUrl: values.submissions?.[index]?.userSubmission?.submissionUrl?.trim()
                            || undefined,
                        mode: selection?.mode,
                        selectedModel: selection?.model ?? undefined,
                        selectedModelProvider: selection?.provider ?? undefined,
                        // SCHEMA V2: send the active language tab; backend falls back to the stored one if absent
                        lang,
                    })
                    const result = response.data?.submitChallengeSubmission
                    if (!result) {
                        throw new Error(response.error?.message)
                    }
                    // track the new job and subscribe to its live notifications
                    const newJobId = result.data?.jobId
                    if (newJobId) {
                        dispatch(setChallengeSubmissionJobId({
                            submissionId,
                            jobId: newJobId,
                        }))
                        jobNotificationsSocket.emit(
                            PublicationEvent.SubscribeJobNotification,
                            {
                                data: {
                                    jobId: newJobId,
                                },
                                locale,
                            },
                        )
                    }
                    return result
                },
                {
                    showSuccessToast: true,
                    showErrorToast: true,
                },
            )
        },
        [
            submitChallengeSubmissionSwr,
            values.submissions,
            selectionBySubmissionId,
            dispatch,
            jobNotificationsSocket,
            locale,
            lang,
            runGraphQL,
            setFieldTouched,
        ],
    )

    /** Navigate to the dedicated result page for this requirement's attempts. */
    const onViewAttempts = useCallback(
        (submissionId: string) => {
            router.push(`${pathname}/result?submission=${submissionId}`)
        },
        [
            router,
            pathname,
        ],
    )

    // Map the hook's auto-save status to its localized label (idle shows nothing).
    const autosaveLabel = autosaveStatus === "idle" ? undefined : tAutosave(autosaveStatus)

    // per-submission status for the accordion header: done = last attempt passed the threshold,
    // failed = attempted but below it, todo = never submitted.
    const statusOf = (row: typeof rows[number]): "done" | "failed" | "todo" => {
        if (!row.submission.userSubmission?.lastAttempt) {
            return "todo"
        }
        return (row.lastAttemptScore ?? 0) >= row.maxScore * passThreshold ? "done" : "failed"
    }
    // auto-open the first deliverable still to pass (the one the learner works on next)
    const firstOpenId = rows.find((row) => statusOf(row) !== "done")?.submission.id

    return (
        <div className={cn(className, "flex flex-col gap-2")}>
            {autosaveLabel && (
                <span
                    aria-live="polite"
                    className={cn(
                        "text-xs",
                        autosaveStatus === "failed" ? "text-danger" : "text-default-500",
                    )}
                >
                    {autosaveLabel}
                </span>
            )}
            {/* deliverables as a nested card (one open at a time): each header shows the submission's
                status + title + its points / earned score; the panel holds the form. Card-in-card →
                border + INHERITED bg (transparent), NOT a second fill on the outer "Nộp bài" card. */}
            <Accordion
                variant="default"
                className="overflow-hidden rounded-2xl border border-default bg-transparent"
                defaultExpandedKeys={firstOpenId ? new Set([firstOpenId]) : undefined}
            >
                {rows.map((row) => {
                    const status = statusOf(row)
                    const attempted = Boolean(row.submission.userSubmission?.lastAttempt)
                    return (
                        <Accordion.Item key={row.submission.id} id={row.submission.id} aria-label={row.submission.title}>
                            <Accordion.Heading>
                                <Accordion.Trigger className="w-full">
                                    <div className="flex w-full items-center justify-between gap-3 text-start">
                                        <div className="flex min-w-0 items-center gap-2">
                                            {status === "done" ? (
                                                <CheckCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-success" />
                                            ) : status === "failed" ? (
                                                <XCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
                                            ) : (
                                                <CircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                            )}
                                            <span className="truncate text-base font-semibold">
                                                {row.submission.sortIndex + 1}. {row.submission.title}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            {attempted ? (
                                                <Typography type="body-xs" color="muted">
                                                    {`${row.lastAttemptScore ?? 0}/${row.maxScore}`}
                                                </Typography>
                                            ) : (
                                                <Chip color="accent" variant="soft" size="sm">
                                                    <Chip.Label>{t("challenge.score", { score: row.maxScore })}</Chip.Label>
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
                                        inAccordion
                                        row={row}
                                        passThreshold={passThreshold}
                                        gradeModels={gradableModels}
                                        gradeSelection={
                                            selectionBySubmissionId[row.submission.id] ?? AUTO_GRADE_SELECTION
                                        }
                                        canPremium={canPremium}
                                        creditUsage={creditUsage ?? undefined}
                                        onOpenAiQuota={openAiQuota}
                                        onChangeUrl={onChangeUrl}
                                        onBlurUrl={onBlurUrl}
                                        onSubmit={onSubmit}
                                        onSelectGrade={onSelectGrade}
                                        onUpgrade={onAddQuota}
                                        onViewAttempts={onViewAttempts}
                                    />
                                </Accordion.Body>
                            </Accordion.Panel>
                        </Accordion.Item>
                    )
                })}
            </Accordion>
        </div>
    )
}
