import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryChallengeSubmissionProgress } from "@/modules/api/graphql/queries/query-challenge-submission-progress"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { ContentTab } from "@/redux/slices/tabs"
import { setChallengeCompletionTasks } from "@/redux/slices/challenge"

/**
 * Fetches the signed-in user's challenge submission progress for the active course
 * (`challengeSubmissionProgress`) and stores it in the challenge slice. Runs only on the
 * Challenges tab once the user is authenticated and enrolled.
 */
export const useQueryChallengeSubmissionProgressSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const course = useAppSelector((state) => state.course.entity)
    const contentTab = useAppSelector((state) => state.tabs.contentTab)
    const dispatch = useAppDispatch()
    return useSWR(
        authenticated && course?.id && contentTab === ContentTab.Challenges
            ? [
                "QUERY_CHALLENGE_SUBMISSION_PROGRESS_SWR",
                course.id,
                enrolled,
                authenticated,
                contentTab,
            ]
            : null,
        async () => {
            if (!course?.id) {
                throw new Error("Course id not found")
            }
            const data = await queryChallengeSubmissionProgress({
                request: {
                    courseId: course.id,
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })
            const payload = data.data?.challengeSubmissionProgress?.data
            if (!payload) {
                throw new Error("Challenge submission progress not found")
            }
            dispatch(setChallengeCompletionTasks(payload.completionTasks))
            return payload
        },
    )
}
