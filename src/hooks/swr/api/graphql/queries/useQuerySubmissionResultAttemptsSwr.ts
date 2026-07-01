import useSWR from "swr"
import { defaultSubmissionAttemptsListSorts, querySubmissionAttempts } from "@/modules/api/graphql/queries/query-submission-attempts"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { useAppSelector } from "@/redux/hooks"

/**
 * Page-friendly variant of the submission-attempts query for the dedicated result
 * page: takes the challenge-submission (requirement) id directly instead of reading
 * the drawer's redux/overlay state, so it works on a standalone route (no overlay
 * `isOpen` gate). Returns `{ data: attempts[], count }` (newest attempt first).
 *
 * @param challengeSubmissionId - the challenge-submission (requirement) id.
 */
export const useQuerySubmissionResultAttemptsSwr = (
    challengeSubmissionId?: string | null,
) => {
    const course = useAppSelector((state) => state.course.entity)
    return useSWR(
        challengeSubmissionId && course?.id
            ? [
                "SUBMISSION_RESULT_ATTEMPTS_SWR",
                challengeSubmissionId,
                course.id,
            ]
            : null,
        async () => {
            if (!course?.id || !challengeSubmissionId) {
                throw new Error("Course or challenge submission id not found")
            }
            const data = await querySubmissionAttempts({
                request: {
                    challengeSubmissionId,
                    filters: {
                        pageNumber: 0,
                        limit: 50,
                        sorts: defaultSubmissionAttemptsListSorts,
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })
            return data.data?.userChallengeSubmissionAttempts?.data ?? null
        },
    )
}
