import useSWRMutation from "swr/mutation"
import { mutateConfirmTwoFactor } from "@/modules/api/graphql/mutations/mutation-confirm-two-factor"
import { type ConfirmTwoFactorRequest } from "@/modules/api/graphql/mutations/types/two-factor"

type MutateConfirmTwoFactorResult = Awaited<ReturnType<typeof mutateConfirmTwoFactor>>

/**
 * SWR mutation wrapper for {@link mutateConfirmTwoFactor} (Bearer from Keycloak).
 */
export const useMutateConfirmTwoFactorSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateConfirmTwoFactorResult,
        Error,
        string,
        ConfirmTwoFactorRequest
    >(
        "MUTATE_CONFIRM_TWO_FACTOR_SWR",
        async (_key, { arg }) => {
            return mutateConfirmTwoFactor({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
