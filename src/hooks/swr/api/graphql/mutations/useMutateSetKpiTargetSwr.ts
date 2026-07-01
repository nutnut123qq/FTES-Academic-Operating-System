import useSWRMutation from "swr/mutation"
import { mutateSetKpiTarget } from "@/modules/api/graphql/mutations/mutation-set-kpi-target"
import { type SetKpiTargetRequest } from "@/modules/api/graphql/mutations/types/set-kpi-target"

type MutateSetKpiTargetResult = Awaited<ReturnType<typeof mutateSetKpiTarget>>

/**
 * SWR mutation wrapper for {@link mutateSetKpiTarget} (Bearer from Keycloak).
 */
export const useMutateSetKpiTargetSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateSetKpiTargetResult,
        Error,
        string,
        SetKpiTargetRequest
    >(
        "MUTATE_SET_KPI_TARGET_SWR",
        async (_key, { arg }) => {
            return mutateSetKpiTarget({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
