import useSWRMutation from "swr/mutation"
import { mutateStartTrial } from "@/modules/api/graphql/mutations/mutation-start-trial"
import { type StartTrialRequest } from "@/modules/api/graphql/mutations/types/start-trial"

type MutateStartTrialResult = Awaited<ReturnType<typeof mutateStartTrial>>

/**
 * SWR mutation wrapper for {@link mutateStartTrial} (Bearer from Keycloak).
 * Triggered by the "Học thử" CTA to create a trial enrollment before routing
 * into the course content.
 */
export const useMutateStartTrialSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateStartTrialResult,
        Error,
        string,
        StartTrialRequest
    >(
        "MUTATE_START_TRIAL_SWR",
        async (_key, { arg }) => {
            return mutateStartTrial({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
