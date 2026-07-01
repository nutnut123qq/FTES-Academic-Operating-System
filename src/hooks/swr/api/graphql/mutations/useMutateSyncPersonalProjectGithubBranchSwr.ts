import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateSyncPersonalProjectGithub } from "@/modules/api/graphql/mutations/mutation-sync-personal-project-github"
import { type SyncPersonalProjectGithubRequest } from "@/modules/api/graphql/mutations/types/sync-personal-project-github"
import { useAppSelector } from "@/redux/hooks"

type MutateSyncPersonalProjectGithubResult = Awaited<
    ReturnType<typeof mutateSyncPersonalProjectGithub>
>

/**
 * SWR mutation for syncing only the personal project Git branch (separate key from URL sync for `isMutating`).
 */
export const useMutateSyncPersonalProjectGithubBranchSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const swr = useSWRMutation<
        MutateSyncPersonalProjectGithubResult,
        Error,
        string,
        SyncPersonalProjectGithubRequest
    >(
        "MUTATE_SYNC_PERSONAL_PROJECT_GITHUB_BRANCH_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateSyncPersonalProjectGithub({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        },
    )
    return swr
}
