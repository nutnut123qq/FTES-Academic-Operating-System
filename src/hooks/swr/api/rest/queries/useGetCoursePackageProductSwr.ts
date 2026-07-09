"use client"

import useSWR from "swr"
import { getProductForCourse, type ProductView } from "@/modules/api/rest/commerce"

/**
 * Resolves the COURSE_UNLOCK product for ONE chosen package of a PACKAGE course,
 * for the detail-page package checkout flow. Calls
 * `GET /api/v1/commerce/products/for-course/{courseId}?packageId={packageId}` and
 * reads `data.id` as the productId to add to the cart.
 *
 * Returns `null` when the package isn't resolvable (endpoint 404s, or the BE
 * `packageId` param hasn't shipped yet) so the caller can keep the buy CTA
 * disabled instead of adding the wrong product. Keyed on `(courseId, packageId)`;
 * issues no request until BOTH are present.
 */
export const useGetCoursePackageProductSwr = (
    courseId: string | undefined,
    packageId: string | undefined,
) => {
    return useSWR<ProductView | null>(
        courseId && packageId
            ? ["GET_COURSE_PACKAGE_PRODUCT_SWR", courseId, packageId]
            : null,
        () =>
            getProductForCourse(courseId as string, packageId as string).catch(
                () => null,
            ),
        { shouldRetryOnError: false },
    )
}
