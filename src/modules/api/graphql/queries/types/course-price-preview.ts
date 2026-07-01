import type { GraphQLResponse } from "../../types"
import type { DiscountReason } from "./recommended-courses"

/** Pre-checkout price preview for a course (mirrors backend `CoursePricePreviewData`). */
export interface QueryCoursePricePreviewData {
    /** Original (pre-discount) VND price (= list / MSRP, struck "before"). */
    originalPriceVnd: number
    /** Active-phase VND price BEFORE loyalty (middle step list → phase → charge). */
    phasePriceVnd: number
    /** Loyalty-discounted VND price (PayOS / Sepay charge this). */
    discountedPriceVnd: number
    /** Loyalty discount percent applied (0–30). */
    discountPercent: number
    /** Original (pre-discount) USD price; null when the active phase has no USD price. */
    originalPriceUsd: number | null
    /** Active-phase USD price BEFORE loyalty; null when no USD price. */
    phasePriceUsd: number | null
    /** Loyalty-discounted USD price; null when the active phase has no USD price. */
    discountedPriceUsd: number | null
    /** Why the loyalty discount applies (drives FE copy). */
    discountReason: DiscountReason
    /** Courses the viewer already owns (fed the discount). */
    enrolledCount: number
}

/** Apollo response for the `coursePricePreview` query. */
export interface QueryCoursePricePreviewResponse {
    /** Top-level `coursePricePreview` field. */
    coursePricePreview: GraphQLResponse<QueryCoursePricePreviewData>
}
