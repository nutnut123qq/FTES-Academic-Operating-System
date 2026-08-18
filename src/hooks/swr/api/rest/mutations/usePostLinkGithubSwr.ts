import useSWRMutation from "swr/mutation"
import {
    linkGithub,
    type GithubCodeRequest,
    type MessageResponse,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link linkGithub}
 * (`POST /api/v1/identity/linked-accounts/github`).
 *
 * Attaches a GitHub identity to the CURRENT authenticated user using the `code` returned
 * by the GitHub redirect flow (state=link).
 */
export const usePostLinkGithubSwr = () => {
    const swr = useSWRMutation<MessageResponse, Error, string, GithubCodeRequest>(
        "POST_LINK_GITHUB_SWR",
        async (_key, { arg }) => {
            return linkGithub(arg)
        },
    )

    return swr
}
