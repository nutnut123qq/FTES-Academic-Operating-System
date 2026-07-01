import useSWRMutation from "swr/mutation"
import { mutateReactCommunityPost } from "@/modules/api/graphql/mutations/mutation-react-community-post"
import { type ReactCommunityPostRequest } from "@/modules/api/graphql/mutations/types/community"

type MutateReactCommunityPostResult = Awaited<ReturnType<typeof mutateReactCommunityPost>>

/**
 * SWR mutation wrapper for {@link mutateReactCommunityPost} (Bearer from Keycloak).
 * Set/change a reaction by passing `type`; remove it by passing `type: null`.
 */
export const useMutateReactCommunityPostSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateReactCommunityPostResult,
        Error,
        string,
        ReactCommunityPostRequest
    >(
        "MUTATE_REACT_COMMUNITY_POST_SWR",
        async (_key, { arg }) => {
            return mutateReactCommunityPost({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
