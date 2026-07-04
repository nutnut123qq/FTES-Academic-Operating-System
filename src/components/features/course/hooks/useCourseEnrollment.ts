"use client"

import { useCallback } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useMutateStartTrialSwr } from "@/hooks/swr/api/graphql/mutations/useMutateStartTrialSwr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { pathConfig } from "@/resources/path"

/** Result of {@link useCourseEnrollment}. */
export interface UseCourseEnrollmentResult {
    /** Whether the viewer already has any enrollment for this course. */
    isEnrolled: boolean
    /** Route to the course enrollment/payment flow. */
    onEnroll: () => void
    /** Enter the course content (continue learning). */
    onContinueLearning: () => void
    /** Start a trial enrollment best-effort, then enter the course content. */
    onTryLearning: () => void
}

/**
 * Shared enrollment intent for the course detail purchase card.
 *
 * Reads the enrollment state from the course detail contract and exposes the
 * three CTA handlers: enroll, continue learning, and try free. Guests are
 * routed through the auth modal before any gated action.
 *
 * ponytail: trial + continue-learning routes use the canonical `/learn` path,
 * which is a FE placeholder until the course content page lands.
 *
 * @param courseId - The course id to act on.
 * @param enrollment - Enrollment state from the course detail contract.
 * @returns {@link UseCourseEnrollmentResult}
 */
export const useCourseEnrollment = (
    courseId: string,
    enrollment?: { isEnrolled?: boolean; isPurchased?: boolean },
): UseCourseEnrollmentResult => {
    const locale = useLocale()
    const router = useRouter()
    const { guard } = useRequireAuth()
    const { trigger: startTrial } = useMutateStartTrialSwr()

    const isEnrolled = enrollment?.isEnrolled === true

    const learnHref = pathConfig().locale(locale).course(courseId).learn().build()
    const enrollHref = `${pathConfig().locale(locale).course(courseId).build()}/enroll`

    const onEnroll = guard(() => {
        router.push(enrollHref)
    }, "auth.context.enroll")

    const onContinueLearning = useCallback(() => {
        router.push(learnHref)
    }, [router, learnHref])

    const onTryLearning = guard(async () => {
        // best-effort: record the trial enrollment so this course shows in "my courses".
        // A failure must not block entering the content.
        try {
            await startTrial({ courseId })
        } catch {
            // ignore — navigate anyway
        }
        router.push(learnHref)
    }, "auth.context.enroll")

    return {
        isEnrolled,
        onEnroll,
        onContinueLearning,
        onTryLearning,
    }
}
