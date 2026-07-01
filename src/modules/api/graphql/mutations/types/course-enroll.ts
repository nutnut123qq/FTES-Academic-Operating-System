import type { GraphQLResponse, QueryVariables } from "../../types"
import type { PaymentType } from "@/modules/types/enums/payment-type"

/** Payload inside `courseEnroll.data` after the standard API wrapper. */
export interface CourseEnrollData {
    /** URL the user should be redirected to complete checkout. */
    checkoutUrl: string
    /** Internal transaction row ID. */
    transactionId: string
    /** Payment-gateway reference ID for reconciliation. */
    referenceId: string
    /** Checkout amount in VND. */
    amount: number
    /** SePay PG only: JSON of signed fields to POST as a form to `checkoutUrl`. */
    checkoutFields?: string | null
}

/** GraphQL `CourseEnrollRequest` body. */
export interface CourseEnrollRequest {
    /** ID of the course to enroll in. */
    courseId: string
    /** Payment gateway to use (PayOS or SePay). */
    paymentType: PaymentType
    /** PayOS return URL after successful payment. */
    payosReturnUrl?: string
    /** PayOS cancel URL if user aborts checkout. */
    payosCancelUrl?: string
}

/** Apollo variables bag for the `courseEnroll` mutation. */
export type MutateCourseEnrollVariables = QueryVariables<CourseEnrollRequest>

/** Apollo response shape for `courseEnroll`. */
export interface MutateCourseEnrollResponse {
    /** Top-level `courseEnroll` field wrapping the standard API response. */
    courseEnroll: GraphQLResponse<CourseEnrollData>
}
