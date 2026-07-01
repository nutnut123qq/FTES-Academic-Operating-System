/**
 * Discriminated-union context that tells the shared payment modal which
 * purchase action to run when the user picks a payment method.
 *
 * The opener (course enroll card / AI subscription tier card) passes this to
 * `usePaymentOverlayState().open(context)`; the modal reads it to decide which
 * SWR mutation to trigger and what payload to send.
 */
export type PaymentContext =
    | CoursePaymentContext
    | AiSubscriptionPaymentContext
    | MembershipPaymentContext

/** Discriminator for the {@link PaymentContext} union. */
export enum PaymentFlow {
    /** Enrolling in (paying for) a course. */
    CourseEnroll = "courseEnroll",
    /** Purchasing an AI subscription tier. */
    AiSubscription = "aiSubscription",
    /** Purchasing community membership. */
    Membership = "membership",
}

/** Payment context for the course-enroll flow. */
export interface CoursePaymentContext {
    /** Marks this as the course-enroll flow. */
    flow: PaymentFlow.CourseEnroll
}

/** Payment context for the AI subscription flow. */
export interface AiSubscriptionPaymentContext {
    /** Marks this as the AI subscription flow. */
    flow: PaymentFlow.AiSubscription
    /** Slug of the subscription tier the user is purchasing. */
    tier: string
}

/** Payment context for the community membership flow. */
export interface MembershipPaymentContext {
    /** Marks this as the membership flow (single product, no tier). */
    flow: PaymentFlow.Membership
}
