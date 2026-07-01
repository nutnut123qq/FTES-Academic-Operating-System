import useSWR from "swr"
import { defaultChallengeSubmissionsSorts, queryChallengeSubmissions } from "@/modules/api/graphql/queries/query-challenge-submissions"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setChallengeSubmissions } from "@/redux/slices/challenge"

/**
 * Lists submission requirements for the focused challenge (`challengeSubmissions`).
 * Runs when `challenge.id` (or loaded `challenge.entity.id`) and course context exist.
 */
export const useQueryChallengeSubmissionsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const course = useAppSelector((state) => state.course.entity)
    const challengeId = useAppSelector(
        (state) => state.challenge.id
    )
    const dispatch = useAppDispatch()
    const swr = useSWR(
        authenticated && course?.id && challengeId
            ? [
                "QUERY_CHALLENGE_SUBMISSIONS_SWR",
                challengeId,
                course.id,
                enrolled,
                authenticated,
            ]
            : null,
        async () => {
            if (!course?.id || !challengeId) {
                throw new Error("Course or challenge id not found")
            }
            const data = await queryChallengeSubmissions({
                request: {
                    challengeId,
                    filters: {
                        sorts: defaultChallengeSubmissionsSorts,
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })
            const payload = data.data?.challengeSubmissions?.data
            if (!payload) {
                throw new Error("Challenge submissions not found")
            }
            dispatch(setChallengeSubmissions(payload.data))
            return payload
        },
    )
    return swr
}
