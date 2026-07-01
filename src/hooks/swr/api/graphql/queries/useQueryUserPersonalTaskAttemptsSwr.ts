import useSWR from "swr"
import { defaultUserPersonalTaskAttemptsListSorts, queryUserPersonalTaskAttempts } from "@/modules/api/graphql/queries/query-user-personal-task-attempts"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR hook for querying paginated user personal task attempts
 * for the currently selected milestone task.
 */
export const useQueryUserPersonalTaskAttemptsSwr = () => {
    const course = useAppSelector((state) => state.course.entity)
    const selectedTaskId = useAppSelector((state) => state.milestone.selectedTaskId)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const swr = useSWR(
        authenticated && course?.id && selectedTaskId
            ? ["QUERY_USER_PERSONAL_TASK_ATTEMPTS_SWR", course.id, selectedTaskId, 50]
            : null,
        async () => {
            if (!course?.id || !selectedTaskId) {
                throw new Error("Course ID or Task ID not found")
            }

            const data = await queryUserPersonalTaskAttempts({
                request: {
                    courseId: course.id,
                    taskId: selectedTaskId,
                    filters: {
                        limit: 50,
                        pageNumber: 0,
                        sorts: defaultUserPersonalTaskAttemptsListSorts,
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })

            const payload = data.data?.userPersonalTaskAttempts?.data
            if (!payload) {
                throw new Error("Failed to fetch personal task attempts")
            }

            return payload
        },
    )

    return swr
}
