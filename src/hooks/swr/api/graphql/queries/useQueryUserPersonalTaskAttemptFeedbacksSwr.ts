import useSWR from "swr"
import { defaultUserPersonalTaskAttemptFeedbacksListSorts, queryUserPersonalTaskAttemptFeedbacks } from "@/modules/api/graphql/queries/query-user-personal-task-attempt-feedbacks"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR hook for querying paginated feedbacks for a specific
 * user personal task attempt. Only fetches when an attemptId is selected.
 */
export const useQueryUserPersonalTaskAttemptFeedbacksSwr = () => {
    const course = useAppSelector((state) => state.course.entity)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const selectedAttemptId = useAppSelector((state) => state.milestone.selectedAttemptId)

    const swr = useSWR(
        authenticated && course?.id && selectedAttemptId
            ? ["QUERY_USER_PERSONAL_TASK_ATTEMPT_FEEDBACKS_SWR", course.id, selectedAttemptId]
            : null,
        async () => {
            if (!course?.id || !selectedAttemptId) {
                throw new Error("Course ID or Attempt ID not found")
            }

            const data = await queryUserPersonalTaskAttemptFeedbacks({
                request: {
                    attemptId: selectedAttemptId,
                    filters: {
                        sorts: defaultUserPersonalTaskAttemptFeedbacksListSorts,
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })

            const payload = data.data?.userPersonalTaskAttemptFeedbacks?.data
            if (!payload) {
                throw new Error("Failed to fetch personal task attempt feedbacks")
            }

            return payload
        },
    )

    return swr
}
