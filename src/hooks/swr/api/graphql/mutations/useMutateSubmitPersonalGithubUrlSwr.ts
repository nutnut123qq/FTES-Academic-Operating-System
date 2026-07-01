import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateSubmitPersonalGithubUrl } from "@/modules/api/graphql/mutations/mutation-submit-personal-github-url"
import { type SubmitPersonalGithubUrlRequest } from "@/modules/api/graphql/mutations/types/submit-personal-github-url"
import { useAppSelector } from "@/redux/hooks"

type MutateSubmitPersonalGithubUrlResult = Awaited<
    ReturnType<typeof mutateSubmitPersonalGithubUrl>
>

/**
 * SWR mutation for submitting personal project GitHub URL.
 */
export const useMutateSubmitPersonalGithubUrlSwr = () => {
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWRMutation<
        MutateSubmitPersonalGithubUrlResult,
        Error,
        string,
        SubmitPersonalGithubUrlRequest
    >(
        "MUTATE_SUBMIT_PERSONAL_GITHUB_URL_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateSubmitPersonalGithubUrl({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        },
    )
    return swr
}
