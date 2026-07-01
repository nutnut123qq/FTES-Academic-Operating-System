import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SetWeeklyGoalRequest, MutateSetWeeklyGoalResponse } from "./types/set-weekly-goal"

const mutation1 = gql`
  mutation SetWeeklyGoal($request: SetWeeklyGoalRequest!) {
    setWeeklyGoal(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationSetWeeklyGoal {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSetWeeklyGoal, DocumentNode> = {
    [MutationSetWeeklyGoal.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSetWeeklyGoal}. */
export type MutateSetWeeklyGoalParams = MutateParams<
    MutationSetWeeklyGoal,
    SetWeeklyGoalRequest
>

/**
 * Sets the viewer's weekly lessons goal.
 *
 * Mirrors `setWeeklyGoal` (mutations/dashboard/set-weekly-goal).
 */
export const mutateSetWeeklyGoal = async ({
    mutation = MutationSetWeeklyGoal.Mutation1,
    request,
    debug,
    signal,
}: MutateSetWeeklyGoalParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateSetWeeklyGoalResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
