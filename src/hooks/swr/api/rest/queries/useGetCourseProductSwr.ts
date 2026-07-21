"use client"

import useSWR from "swr"
import { getProductForCourse, type ProductForCourseView } from "@/modules/api/rest/commerce"

/**
 * Resolves the COURSE_UNLOCK product that unlocks a course, for the detail-page
 * "buy" flow. Returns `null` when the course isn't on sale (the endpoint 404s) so
 * the caller can hide/fall back the buy CTA. Keyed on `courseId` (the course
 * UUID) — an empty id issues no request.
 *
 * `preferPriceVnd` (the course's advertised price) makes the resolver pick the
 * COURSE_UNLOCK product whose price matches the course — so checkout charges the
 * per-course price, not the cheapest/arbitrary product. Part of the SWR key so a
 * price change re-resolves.
 */
export const useGetCourseProductSwr = (
    courseId: string | undefined,
    preferPriceVnd?: number,
) => {
    return useSWR<ProductForCourseView | null>(
        courseId ? ["GET_COURSE_PRODUCT_SWR", courseId, preferPriceVnd ?? null] : null,
        () => getProductForCourse(courseId as string, undefined, preferPriceVnd).catch(() => null),
        { shouldRetryOnError: false },
    )
}
