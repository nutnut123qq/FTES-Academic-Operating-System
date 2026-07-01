"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
} from "react"
import { cn } from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import { dayjs } from "@/modules/dayjs"
import {
    CvFileCard,
} from "./CvFileCard"
import {
    ReviewLevelCard,
} from "./ReviewLevelCard"
import {
    FeedbackSection,
} from "./FeedbackSection"

import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { useCvReviewLevelDetailsOverlayState, useCvSubmissionAttemptsDrawerOverlayState, useCvUpdateOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryCvUrlSwr } from "@/hooks/swr/api/graphql/queries/useQueryCvUrlSwr"
import { useQueryTemplateCvsSwr } from "@/hooks/swr/api/graphql/queries/useQueryTemplateCvsSwr"
import { useCvApplyStore } from "@/hooks/zustand/cvApply/store"
import { useCvReviewForm } from "@/hooks/rhf/useCvReviewForm"
import { JobCategory } from "@/modules/types/enums/job-category"
import { JobStatus } from "@/modules/types/enums/job-status"
import { getFileNameFromUrl } from "@/utils/filename"

/** Props for {@link CVUpload}. */
export type CVUploadProps = WithClassNames<undefined>
/**
 * CV submission block: stored file card, rubric level, review/update actions, and inline job status.
 *
 * Container: owns SWR/redux/formik/derived state and the open/review actions;
 * renders presentational children.
 * @param props - {@link CVUploadProps}
 */
export const CVUpload = ({ className }: CVUploadProps) => {
    /**
     * Translations function.
     */
    const t = useTranslations()
    /**
     * Current locale (dayjs month labels).
     */
    const locale = useLocale()
    /**
     * Selected CV file — shared via zustand store (set by CvUpdateModal).
     */
    const cvFile = useCvApplyStore((state) => state.cvFile)
    /**
     * RHF form for queuing CV AI review (`reviewCv`).
     */
    const cvReviewForm = useCvReviewForm()
    /** Watched rubric id for the selected-template lookup. */
    const cvReviewTemplateId = cvReviewForm.watch("templateCvId")
    /**
     * Opens the CV update upload modal.
     */
    const { open: openCvUpdateModal } = useCvUpdateOverlayState()
    /**
     * Opens the rubric level details / picker modal.
     */
    const { open: openReviewLevelDetailsModal } = useCvReviewLevelDetailsOverlayState()
    /**
     * Opens the drawer listing CV upload attempts (fetch gated by overlay open).
     */
    const { open: openCvSubmissionAttemptsDrawer } = useCvSubmissionAttemptsDrawerOverlayState()
    /**
     * Selected file URL.
     */
    const selectedFileUrl = useMemo(() => {
        if (!cvFile) return ""
        return URL.createObjectURL(cvFile)
    }, [
        cvFile,
    ])
    /**
     * CV URL SWR.
     */
    const cvUrlSwr = useQueryCvUrlSwr()
    /**
     * Template CVs SWR.
     */
    const templateCvsSwr = useQueryTemplateCvsSwr()
    /**
     * CV URL payload.
     */
    const cvUrlPayload = useAppSelector((state) => state.cvUrl.entity)
    /**
     * AI processing data.
     */
    const aiProcessingData = useAppSelector((state) => state.modal.aiProcessingData)
    /**
     * Active CV review job ID.
     */
    const activeCvReviewJobId = aiProcessingData?.category === JobCategory.ReviewCv
        ? aiProcessingData.jobId
        : undefined
    /**
     * Active CV review job status.
     */
    const activeCvReviewJobStatus = useAppSelector((state) => activeCvReviewJobId
        ? state.socketIo.jobStatusByJobId[activeCvReviewJobId]?.data?.status
        : undefined)
    /**
     * Active CV review job error.
     */
    const activeCvReviewJobError = useAppSelector((state) => activeCvReviewJobId
        ? state.socketIo.jobStatusByJobId[activeCvReviewJobId]?.data?.error
        : undefined)
    /**
     * Current CV link.
     */
    const currentCvLink = selectedFileUrl || (cvUrlPayload?.cvUrl ?? "")
    /**
     * Current CV link label.
     */
    const currentCvLinkLabel =
        cvFile?.name ||
        (
            cvUrlPayload?.cvUrl ?
                getFileNameFromUrl(cvUrlPayload.cvUrl)
                : t("cv.submission.defaultCvFileName")
        )
    /**
     * Rubric templates from Redux (hydrated by `useQueryTemplateCvsSwr` core).
     */
    const templateCvs = useAppSelector((state) => state.templateCvs.rows)
    /**
     * Human-readable submission time: `HH:mm, D MMM YYYY` (e.g. `15:33, 23 Jan 2024`).
     */
    const submittedAtLabel = useMemo(() => {
        const raw = cvUrlPayload?.submittedAt
        if (!raw) {
            return t("cv.submission.submittedAtPending")
        }
        const d = dayjs(raw)
        if (!d.isValid()) {
            return t("cv.submission.submittedAtPending")
        }
        const dayjsLocale = locale.startsWith("vi") ? "vi" : "en"
        return d.locale(dayjsLocale).format("HH:mm, D MMMM YYYY")
    }, [
        cvUrlPayload?.submittedAt,
        locale,
        t,
    ])
    /**
     * Handle CV URL SWR.
     */
    useEffect(
        () => {
            if (activeCvReviewJobStatus !== JobStatus.Completed) {
                return
            }
            void cvUrlSwr.mutate()
        }, [
            activeCvReviewJobStatus,
            cvUrlSwr,
        ]
    )

    /**
     * Handle selected file URL.
     */
    useEffect(
        () => {
            return () => {
                if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl)
            }
        }, [
            selectedFileUrl,
        ]
    )

    /**
     * Currently selected rubric template (matched by id).
     */
    const templateCv = useMemo(
        () =>
            templateCvs.find((templateCv) => templateCv.id === cvReviewTemplateId),
        [
            templateCvs,
            cvReviewTemplateId,
        ],
    )

    /**
     * Markdown feedback body: persisted detail when present, otherwise a summary fallback.
     */
    const feedbackMarkdown = useMemo(() => {
        const detail = cvUrlPayload?.detailFeedback?.trim()
        if (detail) {
            return detail
        }
        return t("cv.submission.feedbackSummary")
    }, [
        cvUrlPayload?.detailFeedback,
        t,
    ])
    /**
     * When the backend already returned AI markdown feedback, primary CTA copy becomes "re-run".
     */
    const hasPersistedAiFeedback = useMemo(
        () => Boolean(cvUrlPayload?.detailFeedback?.trim()),
        [
            cvUrlPayload?.detailFeedback,
        ],
    )

    /**
     * Whether the rubric/review actions should be disabled (submitting/loading).
     */
    const isReviewDisabled = useMemo(
        () => templateCvsSwr.isLoading,
        [
            templateCvsSwr.isLoading,
        ],
    )

    /**
     * Whether the review action is pending (form submitting or job in flight).
     */
    const isReviewPending = useMemo(
        () => cvReviewForm.formState.isSubmitting
            || activeCvReviewJobStatus === JobStatus.Processing
            || activeCvReviewJobStatus === JobStatus.Queued,
        [
            cvReviewForm.formState.isSubmitting,
            activeCvReviewJobStatus,
        ],
    )

    /**
     * Queue (or re-run) the AI CV review.
     */
    const onReview = useCallback(
        () => {
            void cvReviewForm.onSubmit()
        },
        [
            cvReviewForm,
        ],
    )

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <CvFileCard
                currentCvLink={currentCvLink}
                currentCvLinkLabel={currentCvLinkLabel}
                submittedAtLabel={submittedAtLabel}
                onOpenUpdate={openCvUpdateModal}
            />
            <ReviewLevelCard
                templateTitle={templateCv?.title}
                templateDescription={templateCv?.description}
                isUpdateDisabled={isReviewDisabled}
                onOpenReviewLevelDetails={openReviewLevelDetailsModal}
            />
            <FeedbackSection
                feedbackMarkdown={feedbackMarkdown}
                hasPersistedAiFeedback={hasPersistedAiFeedback}
                isReviewDisabled={isReviewDisabled}
                isReviewPending={isReviewPending}
                activeCvReviewJobId={activeCvReviewJobId}
                activeCvReviewJobStatus={activeCvReviewJobStatus}
                activeCvReviewJobError={activeCvReviewJobError}
                onReview={onReview}
                onOpenAttempts={openCvSubmissionAttemptsDrawer}
            />
        </div>
    )
}
