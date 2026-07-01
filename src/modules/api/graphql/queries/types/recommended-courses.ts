import type { GraphQLResponse } from "../../types"

/** Why a loyalty discount applies (mirrors BE `DiscountReason`). */
export type DiscountReason =
    | "none"
    | "enrolledCount"
    | "diligent"
    | "both"

/** One recommended (not-yet-enrolled) course with its loyalty-discounted price. */
export interface QueryRecommendedCourseData {
    /** Public display id used for routing to the course detail page. */
    displayId: string
    /** Course title. */
    title: string
    /** Short course description. */
    description: string | null
    /** Thumbnail URL, if any. */
    thumbnailUrl: string | null
    /** List price in VND before any discount. */
    originalPriceVnd: number
    /** Price in VND after the viewer's loyalty discount (== charged at checkout). */
    discountedPriceVnd: number
    /** Applied discount percent (0 when none). */
    discountPercent: number
    /** List price in USD before discount, if set. */
    originalPriceUsd: number | null
    /** Price in USD after discount, if set. */
    discountedPriceUsd: number | null
    /** Why the discount applies (drives the personalised copy). */
    discountReason: DiscountReason
    /** Courses the viewer already owns (for the "đã học N khóa" copy). */
    enrolledCount: number
}

/** The viewer's recommended courses (not enrolled), priced with their loyalty discount. */
export interface QueryRecommendedCoursesData {
    /** Recommended course items. */
    items: Array<QueryRecommendedCourseData>
}

/** Apollo response shape for the `recommendedCourses` query. */
export interface QueryRecommendedCoursesResponse {
    /** Top-level `recommendedCourses` field wrapping the standard API response. */
    recommendedCourses: GraphQLResponse<QueryRecommendedCoursesData>
}
