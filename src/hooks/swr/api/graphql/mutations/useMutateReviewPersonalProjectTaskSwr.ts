import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateReviewPersonalProjectTask } from "@/modules/api/graphql/mutations/mutation-review-personal-project-for-task"
import { type ReviewPersonalProjectTaskRequest } from "@/modules/api/graphql/mutations/types/review-personal-project-for-task"
import { useAppSelector } from "@/redux/hooks"

type MutateReviewPersonalProjectTaskResult = Awaited<
    ReturnType<typeof mutateReviewPersonalProjectTask>
>

/**
 * SWR mutation for queueing personal project task review.
 */
export const useMutateReviewPersonalProjectTaskSwr = () => {
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWRMutation<
        MutateReviewPersonalProjectTaskResult,
        Error,
        string,
        ReviewPersonalProjectTaskRequest
    >(
        "MUTATE_REVIEW_PERSONAL_PROJECT_TASK_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateReviewPersonalProjectTask({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        },
    )
    return swr
}
