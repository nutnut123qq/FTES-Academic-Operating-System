"use client"

import useSWR from "swr"
import { getProductForCourse, type ProductView } from "@/modules/api/rest/commerce"

/**
 * Resolves the COURSE_UNLOCK product that unlocks a course, for the detail-page
 * "buy" flow. Returns `null` when the course isn't on sale (the endpoint 404s) so
 * the caller can hide/fall back the buy CTA. Keyed on `courseId` (the course
 * UUID) — an empty id issues no request.
 */
export const useGetCourseProductSwr = (courseId: string | undefined) => {
    return useSWR<ProductView | null>(
        courseId ? ["GET_COURSE_PRODUCT_SWR", courseId] : null,
        () => getProductForCourse(courseId as string).catch(() => null),
        { shouldRetryOnError: false },
    )
}
