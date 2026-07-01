
import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateSubmitChallengeSubmission } from "@/modules/api/graphql/mutations/mutation-submit-challenge-submission"
import { type SubmitChallengeSubmissionRequest } from "@/modules/api/graphql/mutations/types/submit-challenge-submission"
import { useAppSelector } from "@/redux/hooks"

type MutateSubmitChallengeSubmissionResult = Awaited<
    ReturnType<typeof mutateSubmitChallengeSubmission>
>
/**
 * SWR mutation for {@link mutateSubmitChallengeSubmission} (`X-Course-Id` from Redux).
 */
export const useMutateSubmitChallengeSubmissionSwr = () => {
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWRMutation<
        MutateSubmitChallengeSubmissionResult,
        Error,
        string,
        SubmitChallengeSubmissionRequest
    >(
        "MUTATE_SUBMIT_CHALLENGE_SUBMISSION_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateSubmitChallengeSubmission({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        },
    )
    return swr
}
