import useSWRMutation from "swr/mutation"
import { mutateUpdateProfile } from "@/modules/api/graphql/mutations/mutation-update-profile"
import { type UpdateProfileRequest } from "@/modules/api/graphql/mutations/types/update-profile"

type MutateUpdateProfileResult = Awaited<ReturnType<typeof mutateUpdateProfile>>

/**
 * SWR mutation wrapper for {@link mutateUpdateProfile} (Bearer from Keycloak).
 */
export const useMutateUpdateProfileSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateUpdateProfileResult,
        Error,
        string,
        UpdateProfileRequest
    >(
        "MUTATE_UPDATE_PROFILE_SWR",
        async (_key, { arg }) => {
            return mutateUpdateProfile({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
