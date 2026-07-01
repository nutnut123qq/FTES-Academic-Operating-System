"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import { PublicationEvent } from "@/hooks/socketio/enums/publication-event"
import { useJobNotificationsSocketIo } from "@/hooks/socketio/useJobNotificationsSocketIo"
import { useMutateReviewCvSwr } from "@/hooks/swr/api/graphql/mutations/useMutateReviewCvSwr"
import type { GraphQLResponse } from "@/modules/api/graphql/types"
import type { ReviewCvResponseData } from "@/modules/api/graphql/mutations/types/review-cv"
import { useAppSelector } from "@/redux/hooks"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Form values for the CV review. */
export interface CvReviewFormValues {
    /** `cv_submissions.id`. */
    cvSubmissionId: string
    /** `template_cvs.id` (chosen rubric). */
    templateCvId: string
}

/**
 * react-hook-form for queuing an AI CV review (replaces the old formik).
 * Seeds submission + rubric from redux; submit calls reviewCv then subscribes to job notifications.
 * @returns the RHF methods + `onSubmit`.
 */
export const useCvReviewForm = () => {
    const t = useTranslations()
    const locale = useLocale()
    const mutateReviewCvSwr = useMutateReviewCvSwr()
    const jobNotificationsSocket = useJobNotificationsSocketIo()
    const cvUrlPayload = useAppSelector((state) => state.cvUrl.entity)
    const selectedTemplateId = useAppSelector((state) => state.cvReviewLevel.selectedTemplateId)
    const templateCvs = useAppSelector((state) => state.templateCvs.rows)
    const runGraphQL = useGraphQLWithToast()
    const schema = useMemo(
        () => z.object({
            cvSubmissionId: z.string().trim().min(1, t("cv.submission.toast.submissionNotFound")),
            templateCvId: z.string().trim().min(1, t("cv.submission.toast.reviewLevelRequired")),
        }),
        [t],
    )
    // `selectedTemplateId` is "" until the learner picks one — fall back to the first template.
    const values = useMemo<CvReviewFormValues>(
        () => ({
            cvSubmissionId: cvUrlPayload?.id ?? "",
            templateCvId: selectedTemplateId.trim().length > 0
                ? selectedTemplateId
                : (templateCvs[0]?.id ?? ""),
        }),
        [cvUrlPayload?.id, selectedTemplateId, templateCvs],
    )
    const form = useForm<CvReviewFormValues>({
        resolver: zodResolver(schema),
        values,
    })
    const onSubmit = form.handleSubmit(async (vals) => {
        await runGraphQL(
            async (): Promise<GraphQLResponse<ReviewCvResponseData>> => {
                const reviewResult = await mutateReviewCvSwr.trigger({
                    cvSubmissionId: vals.cvSubmissionId,
                    templateCvId: vals.templateCvId,
                })
                const env = reviewResult?.data?.reviewCv
                if (!env) {
                    throw new Error(t("cv.submission.toast.reviewFailed"))
                }
                if (!env.success) {
                    throw new Error(env.message || t("cv.submission.toast.reviewFailed"))
                }
                const jobId = env.data?.jobId
                if (!jobId) {
                    throw new Error(env.message || t("cv.submission.toast.reviewFailed"))
                }
                jobNotificationsSocket.emit(
                    PublicationEvent.SubscribeJobNotification,
                    { data: { jobId }, locale },
                )
                return env
            },
            { showErrorToast: true, showSuccessToast: true },
        )
    })
    return { ...form, onSubmit }
}
