import useSWRMutation from "swr/mutation"
import { mutateSetAiCeil } from "@/modules/api/graphql/mutations/mutation-set-ai-ceil"
import { type SetAiCeilRequest } from "@/modules/api/graphql/mutations/types/set-ai-ceil"

type MutateSetAiCeilResult = Awaited<ReturnType<typeof mutateSetAiCeil>>

/**
 * SWR mutation wrapper for {@link mutateSetAiCeil} (Bearer from Keycloak).
 * Sets the user's per-surface AI model ceiling; refetch `myAiQuota` after.
 */
export const useMutateSetAiCeilSwr = () => {
    const swr = useSWRMutation<
        MutateSetAiCeilResult,
        Error,
        string,
        SetAiCeilRequest
    >(
        "MUTATE_SET_AI_CEIL_SWR",
        async (_key, { arg }) => {
            return mutateSetAiCeil({
                request: arg,
            })
        }
    )
    return swr
}
