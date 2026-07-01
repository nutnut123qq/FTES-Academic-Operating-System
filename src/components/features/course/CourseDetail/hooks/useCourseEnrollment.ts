"use client"

import {
    useCallback,
} from "react"
import {
    useLocale,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryCourseEnrollmentStatusSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseEnrollmentStatusSwr"
import { useMutateStartTrialSwr } from "@/hooks/swr/api/graphql/mutations/useMutateStartTrialSwr"
import { PaymentFlow } from "@/modules/types/payment"
import { useAppSelector } from "@/redux/hooks"
import { pathConfig } from "@/resources/path"

/** Result of {@link useCourseEnrollment}. */
export interface UseCourseEnrollmentResult {
    /** Whether the viewer is already enrolled. */
    isEnrolled: boolean
    /** Open the payment overlay in the course-enroll flow. */
    onEnroll: () => void
    /** Navigate into the learning experience (enrolled "continue"). */
    onContinueLearning: () => void
    /** Start a trial enrollment (best-effort), then navigate into the content ("Học thử"). */
    onTryLearning: () => void
}

/**
 * Shared enrollment intent for the landing CTAs (hero, pricing rail, mobile bar):
 * reads enrollment status (SWR singleton) + the enroll / continue-learning
 * handlers, so every CTA stays in sync.
 *
 * @returns {@link UseCourseEnrollmentResult}.
 */
export const useCourseEnrollment = (): UseCourseEnrollmentResult => {
    const locale = useLocale()
    const router = useRouter()
    const { open } = usePaymentOverlayState()
    const enrollmentSwr = useQueryCourseEnrollmentStatusSwr()
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    // real course UUID (the startTrial mutation resolves by id, not the display slug)
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const { trigger: startTrial } = useMutateStartTrialSwr()

    const isEnrolled = enrollmentSwr.data?.courseEnrollmentStatus?.data?.isEnrolled === true

    const onEnroll = useCallback(
        () => open({ flow: PaymentFlow.CourseEnroll }),
        [open],
    )
    const contentHref = useCallback(
        // land on the course-content dashboard (`/learn/content`); the module list/overview
        // surface was removed, so the learner resumes from the dashboard's "Continue" action.
        () => pathConfig().locale(locale).course(courseDisplayId).learn().content().build(),
        [locale, courseDisplayId],
    )
    const onContinueLearning = useCallback(
        () => router.push(contentHref()),
        [router, contentHref],
    )
    const onTryLearning = useCallback(
        async () => {
            // best-effort: record the trial enrollment so this course shows in "my courses"
            // with progress; a failure must not block entering the content (the backend
            // enrollment guard also establishes it on first course-scoped action).
            try {
                if (courseId) {
                    await startTrial({ courseId })
                }
            } catch {
                // ignore — navigate anyway
            }
            router.push(contentHref())
        },
        [courseId, startTrial, router, contentHref],
    )

    return {
        isEnrolled,
        onEnroll,
        onContinueLearning,
        onTryLearning,
    }
}
