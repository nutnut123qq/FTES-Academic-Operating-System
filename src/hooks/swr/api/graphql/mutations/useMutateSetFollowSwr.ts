import useSWRMutation from "swr/mutation"
import { mutateSetFollow } from "@/modules/api/graphql/mutations/mutation-set-follow"
import { type SetFollowRequest } from "@/modules/api/graphql/mutations/types/set-follow"

type MutateSetFollowResult = Awaited<ReturnType<typeof mutateSetFollow>>

/**
 * SWR mutation wrapper for {@link mutateSetFollow} (Bearer from Keycloak).
 */
export const useMutateSetFollowSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateSetFollowResult,
        Error,
        string,
        SetFollowRequest
    >(
        "MUTATE_SET_FOLLOW_SWR",
        async (_key, { arg }) => {
            return mutateSetFollow({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
