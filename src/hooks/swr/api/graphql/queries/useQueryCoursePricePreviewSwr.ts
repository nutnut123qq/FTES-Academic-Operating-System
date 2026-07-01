import useSWR from "swr"
import { queryCoursePricePreview } from "@/modules/api/graphql/queries/query-course-price-preview"
import type { QueryCoursePricePreviewData } from "@/modules/api/graphql/queries/types/course-price-preview"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryCoursePricePreview}. `data` is the viewer's pre-checkout
 * price for a course (original vs loyalty-discounted), or `null`. Disabled until both a
 * `courseId` is given and the viewer is authenticated (loyalty discount is per-user).
 *
 * @param courseId - The course to price, or null/undefined to disable the fetch.
 */
export const useQueryCoursePricePreviewSwr = (courseId: string | null | undefined) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryCoursePricePreviewData | null>(
        courseId && authenticated
            ? ["QUERY_COURSE_PRICE_PREVIEW_SWR", courseId]
            : null,
        async () => {
            const result = await queryCoursePricePreview({ courseId: courseId as string })
            return result.data?.coursePricePreview?.data ?? null
        },
    )
}
