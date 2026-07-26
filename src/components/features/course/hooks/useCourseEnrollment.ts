"use client"

import { useCallback } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useSWRConfig } from "swr"
import { useMutateStartTrialSwr } from "@/hooks/swr/api/graphql/mutations/useMutateStartTrialSwr"
import { useGetCourseProductSwr } from "@/hooks/swr/api/rest/queries/useGetCourseProductSwr"
import { useGetCartSwr } from "@/hooks/swr/api/rest/queries/useGetCartSwr"
import { usePostAddCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr"
import { usePostRemoveCartItemSwr } from "@/hooks/swr/api/rest/mutations/usePostRemoveCartItemSwr"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { pathConfig } from "@/resources/path"
import type { ProductForCourseView } from "@/modules/api/rest/commerce"

/**
 * The commerce context an enroll CTA needs to run the real checkout: the BE course
 * UUID that resolves the COURSE_UNLOCK product, plus a title for the payment summary.
 */
export interface CourseEnrollmentBuyContext {
    /** BE course UUID (`course.rawId`) — resolves the COURSE_UNLOCK product. */
    rawId?: string
    /** Human title shown on the PaymentModal summary line. */
    title?: string
    /**
     * The course's advertised price (`course.price.vnd`). Resolves the COURSE_UNLOCK
     * product whose price MATCHES the course so checkout charges the per-course price
     * (399k), not the cheapest/arbitrary product (200k). Omit to keep the old behaviour.
     */
    priceVnd?: number
}

/** Result of {@link useCourseEnrollment}. */
export interface UseCourseEnrollmentResult {
    /** Whether the viewer already has any enrollment for this course. */
    isEnrolled: boolean
    /** Buy the course: add its unlock product to the cart and open PaymentModal. */
    onEnroll: () => void
    /** Whether the add-to-cart step is in flight (drive the CTA's pending state). */
    isEnrolling: boolean
    /**
     * Whether {@link onEnroll} can actually complete a purchase — i.e. the course's
     * COURSE_UNLOCK product resolved. FALSE means the CTA must be disabled: there is
     * no checkout to run, and no other page to send the viewer to.
     */
    canBuy: boolean
    /**
     * Whether the product lookup is still in flight. Distinguishes "not on sale" from
     * "we don't know yet", so the CTA never flashes the not-on-sale copy while loading.
     */
    isResolvingProduct: boolean
    /** Enter the course content (continue learning). */
    onContinueLearning: () => void
    /** Start a trial enrollment best-effort, then enter the course content. */
    onTryLearning: () => void
    /**
     * The resolved COURSE_UNLOCK product for this course (null when not on sale /
     * still resolving). Drives the "add to cart" affordance.
     */
    product: ProductForCourseView | null
    /** Whether the resolved product is already in the viewer's cart. */
    inCart: boolean
    /** Add the resolved product to the cart WITHOUT opening checkout (guest → auth). */
    onAddToCart: () => void
    /** Remove the resolved product from the cart (reachable only once in cart). */
    onRemoveFromCart: () => void
    /** Whether an add/remove cart mutation is in flight (drive the CTA's pending state). */
    isTogglingCart: boolean
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
 * course isn't on sale (no product / no `rawId`) there is no checkout to run, so
 * `canBuy` is false and the caller MUST disable the CTA — the hook does not fall
 * back to a navigation (the old fallback pushed the page it was already on).
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
    // `rawId` so PACKAGE / not-for-sale courses issue no request. `priceVnd` steers the
    // resolver to the product matching the course price (charge the per-course price).
    const { data: product, isLoading: isResolvingProduct } = useGetCourseProductSwr(
        buy?.rawId,
        buy?.priceVnd,
    )
    const addCart = usePostAddCartItemSwr()
    const removeCart = usePostRemoveCartItemSwr()
    const payment = usePaymentOverlayState()
    const { mutate: mutateSwr } = useSWRConfig()

    const isEnrolled = enrollment?.isEnrolled === true

    // Cart membership for the resolved product → drives the secondary CTA's
    // "Thêm vào giỏ" ↔ "Đã trong giỏ" (remove) toggle. Signed-in only, and skipped
    // once enrolled (no re-buy) so a guest never fires the authed call.
    const { data: cart } = useGetCartSwr(!isEnrolled)
    const cartItem = product ? cart?.items.find((item) => item.productId === product.id) : undefined
    const inCart = Boolean(cartItem)

    const learnHref = pathConfig().locale(locale).course(courseId).learn().build()

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
                    // On success the modal cheers and offers "start learning" straight
                    // into this course's content (mirrors onContinueLearning's route).
                    learnHref,
                })
            } catch {
                // add-to-cart failed → SWR surfaces the error; leave the CTA idle
            }
            return
        }
        // No product → there is NOTHING to check out. The old fallback pushed
        // `detailHref`, which IS the page the CTA lives on: the button "worked" and
        // nothing happened. Callers must disable the CTA via `canBuy` instead.
    }, "auth.context.enroll")

    // Secondary CTA: add the resolved product to the cart WITHOUT opening checkout
    // (mirrors the PACKAGE card's "Thêm vào giỏ" peer). No-op once it's already in the
    // cart (the button flips to the remove state then). Guests are routed through auth.
    const onAddToCart = guard(async () => {
        if (!product || inCart) return
        try {
            await addCart.trigger({ productId: product.id, quantity: 1 })
            void mutateSwr("GET_CART_SWR")
        } catch {
            // add-to-cart failed → SWR surfaces the error; leave the CTA idle
        }
    }, "auth.context.enroll")

    // Remove the resolved product from the cart (reachable only once it IS in cart).
    const onRemoveFromCart = useCallback(async () => {
        if (!cartItem) return
        try {
            await removeCart.trigger(cartItem.id)
            void mutateSwr("GET_CART_SWR")
        } catch {
            // remove failed → SWR surfaces the error; leave the item in place
        }
    }, [cartItem, removeCart, mutateSwr])

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
        canBuy: Boolean(product),
        isResolvingProduct,
        onContinueLearning,
        onTryLearning,
        product: product ?? null,
        inCart,
        onAddToCart,
        onRemoveFromCart,
        isTogglingCart: addCart.isMutating || removeCart.isMutating,
    }
}
