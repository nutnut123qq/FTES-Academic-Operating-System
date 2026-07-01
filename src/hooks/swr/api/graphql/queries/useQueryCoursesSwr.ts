import useSWR from "swr"
import { queryCourses } from "@/modules/api/graphql/queries/query-courses"
import { useAppDispatch } from "@/redux/hooks"
import { setCourses } from "@/redux/slices/course"

/** Params for {@link useQueryCoursesSwr} — server-side search + pagination (ES-backed, scales). */
export interface UseQueryCoursesSwrParams {
    /** Full-text search string (title/description); empty = no filter. */
    search?: string
    /** Zero-based page index. */
    pageNumber?: number
    /** Page size; omit to use the backend default. */
    limit?: number
}

/**
 * Query the paginated, searchable `courses` list (Elasticsearch-backed). Keyed on
 * search + page + limit so each filter/page is cached independently. Also mirrors the
 * current page into redux `course.entities` for any incidental consumer.
 *
 * @param params - {@link UseQueryCoursesSwrParams}
 */
export const useQueryCoursesSwr = ({
    search = "",
    pageNumber = 0,
    limit,
}: UseQueryCoursesSwrParams = {}) => {
    const dispatch = useAppDispatch()
    const trimmed = search.trim()
    const swr = useSWR(
        [
            "QUERY_COURSES_SWR",
            trimmed,
            pageNumber,
            limit ?? 0,
        ],
        async () => {
            const data = await queryCourses(
                {
                    request: {
                        filters: {
                            sorts: [],
                            ...(trimmed ? { search: trimmed } : {}),
                            pageNumber,
                            ...(limit != null ? { limit } : {}),
                        },
                    },
                }
            )
            if (!data || !data.data) {
                throw new Error("Courses not found")
            }
            dispatch(setCourses(data.data.courses.data?.data ?? []))
            return data.data
        })
    return swr
}
