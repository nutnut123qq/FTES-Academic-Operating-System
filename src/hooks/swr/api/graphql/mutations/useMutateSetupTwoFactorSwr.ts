import useSWRMutation from "swr/mutation"
import { mutateSetupTwoFactor } from "@/modules/api/graphql/mutations/mutation-setup-two-factor"

type MutateSetupTwoFactorResult = Awaited<ReturnType<typeof mutateSetupTwoFactor>>

/**
 * SWR mutation wrapper for {@link mutateSetupTwoFactor} (no variables).
 */
export const useMutateSetupTwoFactorSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateSetupTwoFactorResult,
        Error,
        string
    >(
        "MUTATE_SETUP_TWO_FACTOR_SWR",
        async () => {
            return mutateSetupTwoFactor({})
        }
    )
    /** Return the SWR mutation. */
    return swr
}
