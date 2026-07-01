import useSWRMutation from "swr/mutation"
import { mutateCreateCommunityPost } from "@/modules/api/graphql/mutations/mutation-create-community-post"
import { type CreateCommunityPostRequest } from "@/modules/api/graphql/mutations/types/community"

type MutateCreateCommunityPostResult = Awaited<ReturnType<typeof mutateCreateCommunityPost>>

/**
 * SWR mutation wrapper for {@link mutateCreateCommunityPost} (Bearer from Keycloak).
 * Creates a community post; quota-checked server-side for non-members.
 */
export const useMutateCreateCommunityPostSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateCreateCommunityPostResult,
        Error,
        string,
        CreateCommunityPostRequest
    >(
        "MUTATE_CREATE_COMMUNITY_POST_SWR",
        async (_key, { arg }) => {
            return mutateCreateCommunityPost({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
