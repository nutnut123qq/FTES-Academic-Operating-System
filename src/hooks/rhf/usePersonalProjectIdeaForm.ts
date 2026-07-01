"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { useMutateSubmitPersonalProjectIdealSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSubmitPersonalProjectIdealSwr"
import { useQueryCourseEnrollmentStatusSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseEnrollmentStatusSwr"
import { useAppSelector } from "@/redux/hooks"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Form values for the personal-project idea. */
export interface PersonalProjectIdeaFormValues {
    /** Idea text. */
    ideaText: string
}

/**
 * react-hook-form for submitting the personal-project idea (replaces the old formik).
 * Seeds `ideaText` from the redux enrollment; submit calls the mutation then revalidates enrollment.
 * @returns the RHF methods + `onSubmit`.
 */
export const usePersonalProjectIdeaForm = () => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const submitPersonalProjectIdealSwr = useMutateSubmitPersonalProjectIdealSwr()
    const queryCourseEnrollmentStatusSwr = useQueryCourseEnrollmentStatusSwr()
    const enrollment = useAppSelector((state) => state.user.enrollment)
    const course = useAppSelector((state) => state.course.entity)
    const schema = useMemo(
        () => z.object({
            ideaText: z.string().trim()
                .min(1, t("finalProject.page.submit.ideaRequired"))
                .min(10, t("finalProject.page.submit.ideaTooShort")),
        }),
        [t],
    )
    const form = useForm<PersonalProjectIdeaFormValues>({
        resolver: zodResolver(schema),
        // re-seed when enrollment changes (replaces formik's enableReinitialize).
        values: { ideaText: enrollment?.ideaText ?? "" },
    })
    const onSubmit = form.handleSubmit(async (value) => {
        const normalizedIdeaText = value.ideaText.trim()
        await runGraphQL(
            async () => {
                if (!course?.id) {
                    throw new Error("Course id not found")
                }
                const result = await submitPersonalProjectIdealSwr.trigger({
                    courseId: course.id,
                    ideaText: normalizedIdeaText,
                })
                const env = result?.data?.submitPersonalProjectIdeal
                if (!env) {
                    throw new Error("Submit failed")
                }
                if (!env.success) {
                    throw new Error(env.error ?? env.message ?? "Submit failed")
                }
                await queryCourseEnrollmentStatusSwr.mutate()
                return env
            },
            { showErrorToast: true, showSuccessToast: true },
        )
    })
    return { ...form, onSubmit }
}
