import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryChallenge } from "@/modules/api/graphql/queries/query-challenge"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setChallenge } from "@/redux/slices/challenge"

/**
 * Singleton SWR for `challenge(request: { id })` — id from `challenge.id` (`setChallengeId`).
 */
export const useQueryChallengeSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const challengeId = useAppSelector((state) => state.challenge.id)
    const course = useAppSelector((state) => state.course.entity)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const dispatch = useAppDispatch()
    const swr = useSWR(
        authenticated && challengeId && course?.id
            ? [
                "QUERY_CHALLENGE_SWR",
                challengeId,
                course?.id,
                enrolled,
                authenticated,
            ]
            : null,
        async () => {
            if (!challengeId || !course?.id) {
                throw new Error("Challenge or course id not found")
            }
            const data = await queryChallenge({
                request: { id: challengeId },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })
            if (!data?.data?.challenge?.data) {
                throw new Error("Challenge not found")
            }
            dispatch(setChallenge(data.data.challenge.data))
            return data.data.challenge.data
        },
    )
    return swr
}
