import useSWR from "swr"
import { defaultSubmissionFeedbacksListSorts, querySubmissionFeedbacks } from "@/modules/api/graphql/queries/query-submission-feedbacks"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { useAppSelector } from "@/redux/hooks"

/**
 * Page-friendly variant of the submission-feedbacks query for the dedicated result
 * page: takes the attempt id directly (no drawer/overlay coupling), so it fetches on
 * a standalone route. Returns `{ data: feedbacks[], count }`.
 *
 * @param submissionAttemptId - the attempt whose feedback items to load.
 */
export const useQuerySubmissionResultFeedbacksSwr = (
    submissionAttemptId?: string | null,
) => {
    const course = useAppSelector((state) => state.course.entity)
    return useSWR(
        submissionAttemptId && course?.id
            ? [
                "SUBMISSION_RESULT_FEEDBACKS_SWR",
                submissionAttemptId,
                course.id,
            ]
            : null,
        async () => {
            if (!course?.id || !submissionAttemptId) {
                throw new Error("Course or submission attempt id not found")
            }
            const data = await querySubmissionFeedbacks({
                request: {
                    submissionAttemptId,
                    filters: {
                        sorts: defaultSubmissionFeedbacksListSorts,
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })
            return data.data?.userChallengeSubmissionFeedbacks?.data ?? null
        },
    )
}
