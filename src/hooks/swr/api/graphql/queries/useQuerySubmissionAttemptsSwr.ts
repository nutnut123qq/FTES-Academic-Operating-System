import useSWR from "swr"
import { defaultSubmissionAttemptsListSorts, querySubmissionAttempts } from "@/modules/api/graphql/queries/query-submission-attempts"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { useSubmissionAttemptsOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSubmissionAttempts, setSubmissionAttemptsCount } from "@/redux/slices/submission-attempt"

/**
 * Lists submission requirements for the focused challenge (`challengeSubmissions`).
 * Runs when `challenge.id` (or loaded `challenge.entity.id`) and course context exist.
 */
export const useQuerySubmissionAttemptsSwr = () => {
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const course = useAppSelector((state) => state.course.entity)
    const dispatch = useAppDispatch()
    const activeChallengeSubmissionId = useAppSelector(
        (state) => state.submissionAttempt.activeChallengeSubmissionId,
    )
    const pageNumber = useAppSelector((state) => state.submissionAttempt.pageNumber)
    const limit = useAppSelector((state) => state.submissionAttempt.limit)
    const { isOpen } = useSubmissionAttemptsOverlayState()
    const swr = useSWR(
        enrolled && course?.id && activeChallengeSubmissionId && isOpen
            ? [
                "QUERY_SUBMISSION_ATTEMPTS_SWR",
                activeChallengeSubmissionId,
                course.id,
                enrolled,
                isOpen,
                pageNumber,
                limit,
            ]
            : null,
        async () => {
            if (!course?.id || !activeChallengeSubmissionId) {
                throw new Error("Course or challenge submission id not found")
            }
            const data = await querySubmissionAttempts({
                request: {
                    challengeSubmissionId: activeChallengeSubmissionId,
                    filters: {
                        pageNumber: pageNumber ? pageNumber - 1 : 0,
                        limit: limit ?? 10,
                        sorts: defaultSubmissionAttemptsListSorts,
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })
            const payload = data.data?.userChallengeSubmissionAttempts?.data
            if (!payload) {
                throw new Error("Submission attempts not found")
            }   
            dispatch(setSubmissionAttempts(payload.data))
            dispatch(setSubmissionAttemptsCount(payload.count))
            return payload
        },
    )
    return swr
}
