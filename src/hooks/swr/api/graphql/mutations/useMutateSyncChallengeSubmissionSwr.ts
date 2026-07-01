import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateSyncChallengeSubmissions } from "@/modules/api/graphql/mutations/mutation-sync-challenge-submission"
import { type SyncSubmissionRequest } from "@/modules/api/graphql/mutations/types/sync-challenge-submission"
import { useAppSelector } from "@/redux/hooks"

type MutateSyncChallengeSubmissionsResult = Awaited<
    ReturnType<typeof mutateSyncChallengeSubmissions>
>

/**
 * SWR mutation for {@link mutateSyncChallengeSubmissions} (`X-Course-Id` from Redux).
 */
export const useMutateSyncChallengeSubmissionSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const swr = useSWRMutation<
        MutateSyncChallengeSubmissionsResult,
        Error,
        string,
        SyncSubmissionRequest
    >(
        "MUTATE_SYNC_CHALLENGE_SUBMISSIONS_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateSyncChallengeSubmissions({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        },
    )
    return swr
}
