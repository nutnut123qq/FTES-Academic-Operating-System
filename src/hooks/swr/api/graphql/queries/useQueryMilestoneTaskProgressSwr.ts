import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryMilestoneTaskProgress } from "@/modules/api/graphql/queries/query-milestone-task-progress"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query core for the milestone task progress query. Progress is per-user, so
 * it only runs once the viewer is authenticated and a course is active.
 * @returns the SWR query handle.
 */
export const useQueryMilestoneTaskProgressSwr = () => {
    const course = useAppSelector((state) => state.course.entity)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const swr = useSWR(
        authenticated && course?.id
            ? ["QUERY_MILESTONE_TASK_PROGRESS_SWR", course.id]
            : null,
        async () => {
            if (!course?.id) {
                throw new Error("Course ID not found")
            }

            const data = await queryMilestoneTaskProgress({
                request: {
                    courseId: course.id,
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })

            if (!data || !data.data) {
                throw new Error("Failed to fetch milestone task progress")
            }

            return data.data
        },
    )

    return swr
}
