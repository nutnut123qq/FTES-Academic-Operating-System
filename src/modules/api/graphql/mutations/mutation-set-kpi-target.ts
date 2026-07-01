import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SetKpiTargetRequest, MutateSetKpiTargetResponse } from "./types/set-kpi-target"

const mutation1 = gql`
  mutation SetKpiTarget($request: SetKpiTargetRequest!) {
    setKpiTarget(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationSetKpiTarget {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSetKpiTarget, DocumentNode> = {
    [MutationSetKpiTarget.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSetKpiTarget}. */
export type MutateSetKpiTargetParams = MutateParams<
    MutationSetKpiTarget,
    SetKpiTargetRequest
>

/**
 * Sets one of the viewer's weekly KPI targets.
 *
 * Mirrors `setKpiTarget` (mutations/profile/set-kpi-target).
 */
export const mutateSetKpiTarget = async ({
    mutation = MutationSetKpiTarget.Mutation1,
    request,
    debug,
    signal,
}: MutateSetKpiTargetParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateSetKpiTargetResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
