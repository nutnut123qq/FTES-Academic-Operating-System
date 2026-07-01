import useSWR from "swr"
import { queryUserCourses } from "@/modules/api/graphql/queries/query-user-courses"

/**
 * SWR hook for a user's joined courses (with milestone progress) by id. Public —
 * works for anonymous viewers. Returns the list (empty array on absent data);
 * pass a null/undefined userId to disable the fetch.
 *
 * @param userId - id of the user whose joined courses to fetch
 * @returns the SWR handle (data = array of course progress items)
 */
export const useQueryUserCoursesSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        // no key (→ no request) until we actually have a user id
        userId ? ["QUERY_USER_COURSES_SWR", userId] : null,
        async () => {
            const data = await queryUserCourses({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user courses")
            }
            // unwrap the standard API envelope; default to [] when null
            return data.data.userCourses?.data ?? []
        },
    )
    return swr
}
