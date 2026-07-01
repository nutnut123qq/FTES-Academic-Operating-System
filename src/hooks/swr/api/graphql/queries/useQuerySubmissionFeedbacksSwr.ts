import useSWR from "swr"
import { useFeedbackDetailsOverlayState } from "@/hooks/zustand/overlay/hooks"
import { defaultSubmissionFeedbacksListSorts, querySubmissionFeedbacks } from "@/modules/api/graphql/queries/query-submission-feedbacks"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSubmissionFeedbacks, setSubmissionFeedbacksCount } from "@/redux/slices/submission-feedback"

/**
 * Lists submission feedbacks for the focused challenge submission (`challengeSubmissions`).
 * Runs when `challengeSubmission.id` and course context exist.
 */
export const useQuerySubmissionFeedbacksSwr = () => {
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const course = useAppSelector((state) => state.course.entity)
    const dispatch = useAppDispatch()
    const { isOpen } = useFeedbackDetailsOverlayState()
    const submissionAttemptId = useAppSelector(
        (state) => state.submissionAttempt.id
    )
    const swr = useSWR(
        enrolled && course?.id && submissionAttemptId && isOpen
            ? [
                "QUERY_SUBMISSION_FEEDBACKS_SWR",
                submissionAttemptId,
                course.id,
                enrolled,
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
            const payload = data.data?.userChallengeSubmissionFeedbacks?.data
            if (!payload) {
                throw new Error("Submission feedbacks not found")
            }   
            dispatch(setSubmissionFeedbacks(payload.data))
            dispatch(setSubmissionFeedbacksCount(payload.count))
            return payload
        },
    )
    return swr
}
