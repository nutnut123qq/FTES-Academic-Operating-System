"use client"

import { useCallback } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useSWRConfig } from "swr"
import { useMutateStartTrialSwr } from "@/hooks/swr/api/graphql/mutations/useMutateStartTrialSwr"
import { useGetCourseProductSwr } from "@/hooks/swr/api/rest/queries/useGetCourseProductSwr"
import { usePostAddCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { pathConfig } from "@/resources/path"

/**
 * The commerce context an enroll CTA needs to run the real checkout: the BE course
 * UUID that resolves the COURSE_UNLOCK product, plus a title for the payment summary.
 */
export interface CourseEnrollmentBuyContext {
    /** BE course UUID (`course.rawId`) — resolves the COURSE_UNLOCK product. */
    rawId?: string
    /** Human title shown on the PaymentModal summary line. */
    title?: string
}

/** Result of {@link useCourseEnrollment}. */
export interface UseCourseEnrollmentResult {
    /** Whether the viewer already has any enrollment for this course. */
    isEnrolled: boolean
    /** Buy the course: add its unlock product to the cart and open PaymentModal. */
    onEnroll: () => void
    /** Whether the add-to-cart step is in flight (drive the CTA's pending state). */
    isEnrolling: boolean
    /** Enter the course content (continue learning). */
    onContinueLearning: () => void
    /** Start a trial enrollment best-effort, then enter the course content. */
    onTryLearning: () => void
}

/**
 * Shared enrollment intent for the course detail purchase card.
 *
 * Reads the enrollment state from the course detail contract and exposes the CTA
 * handlers: enroll (real checkout), continue learning, and try free. Guests are
 * routed through the auth modal before any gated action.
 *
 * `onEnroll` runs the SAME real checkout as the course detail buy: resolve the
 * COURSE_UNLOCK product for `buy.rawId`, add it to the cart, then open the shared
 * {@link usePaymentOverlayState} PaymentModal with the new cart-item id. When the
 * course isn't on sale (no product / no `rawId`), it falls back to the course
 * detail sales page — never the (removed) mock enroll route.
 *
 * ponytail: trial + continue-learning routes use the canonical `/learn` path,
 * which is a FE placeholder until the course content page lands.
 *
 * @param courseId - The course id (slug) to act on.
 * @param enrollment - Enrollment state from the course detail contract.
 * @param buy - Commerce context (course UUID + title) so `onEnroll` can check out.
 * @returns {@link UseCourseEnrollmentResult}
 */
export const useCourseEnrollment = (
    courseId: string,
    enrollment?: { isEnrolled?: boolean; isPurchased?: boolean },
    buy?: CourseEnrollmentBuyContext,
): UseCourseEnrollmentResult => {
    const locale = useLocale()
    const router = useRouter()
    const { guard } = useRequireAuth()
    const { trigger: startTrial } = useMutateStartTrialSwr()

    // Resolve the course's COURSE_UNLOCK product (null when not on sale). Gated on a
    // `rawId` so PACKAGE / not-for-sale courses issue no request.
    const { data: product } = useGetCourseProductSwr(buy?.rawId)
    const addCart = usePostAddCartItemSwr()
    const payment = usePaymentOverlayState()
    const { mutate: mutateSwr } = useSWRConfig()

    const isEnrolled = enrollment?.isEnrolled === true

    const learnHref = pathConfig().locale(locale).course(courseId).learn().build()
    const detailHref = pathConfig().locale(locale).course(courseId).build()

    const onEnroll = guard(async () => {
        // On sale → real checkout: add the unlock product to the cart, then open the
        // global PaymentModal with the new cart-item id (mirrors CourseDetail onBuy).
        if (product) {
            try {
                const item = await addCart.trigger({ productId: product.id, quantity: 1 })
                void mutateSwr("GET_CART_SWR")
                payment.open({
                    itemIds: [item.id],
                    title: buy?.title ?? "",
                    amountVnd: product.priceVnd ?? 0,
                    amountCoin: product.priceCoin ?? undefined,
                })
            } catch {
                // add-to-cart failed → SWR surfaces the error; leave the CTA idle
            }
            return
        }
        // Not resolvable here (no rawId / not on sale) → the course sales page, whose
        // enroll card resolves the product and opens the same PaymentModal.
        router.push(detailHref)
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
        isEnrolling: addCart.isMutating,
        onContinueLearning,
        onTryLearning,
    }
}
