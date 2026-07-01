import useSWRInfinite from "swr/infinite"
import { queryCourseLearningHistory } from "@/modules/api/graphql/queries/query-course-learning-history"
import type { CourseLearningHistoryResponseData } from "@/modules/api/graphql/queries/types/course-learning-history"
import { useAppSelector } from "@/redux/hooks"

/** Events per learning-history page. */
const PAGE_LIMIT = 20

/**
 * Cursor-paginated SWR hook for the signed-in viewer's per-course learning history
 * (the day timeline). Each page keys off the previous page's `nextCursor`; returns
 * a `null` key to stop when the history is exhausted, no course is selected, or the
 * viewer is not authenticated. Re-keys on `courseId` so switching course refetches
 * from page 1.
 *
 * @param courseId - The course RELAY GLOBAL ID (the `?course=` param value, passed
 *   straight through — the backend decodes it), or `null` to skip fetching.
 * @returns the SWRInfinite handle (data = array of pages, size, setSize, ...)
 */
export const useQueryCourseLearningHistorySwr = (courseId: string | null) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const getKey = (
        index: number,
        previous: CourseLearningHistoryResponseData | null,
    ): readonly [string, string, string] | null => {
        // nothing to fetch until authenticated with a selected course
        if (!authenticated || !courseId) {
            return null
        }
        // previous page had no next cursor → end of history, stop
        if (previous && previous.nextCursor === null) {
            return null
        }
        // page 1 has no cursor; later pages use the previous page's nextCursor
        const cursor = index === 0 ? "" : previous?.nextCursor ?? ""
        return ["QUERY_COURSE_LEARNING_HISTORY_SWR", courseId, cursor]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentCourseId, cursor]) => {
            const result = await queryCourseLearningHistory({
                request: {
                    courseId: currentCourseId,
                    cursor: cursor || undefined,
                    limit: PAGE_LIMIT,
                },
            })
            if (!result || !result.data) {
                throw new Error("Failed to fetch course learning history")
            }
            return result.data.courseLearningHistory?.data ?? { items: [], nextCursor: null }
        },
    )
}
