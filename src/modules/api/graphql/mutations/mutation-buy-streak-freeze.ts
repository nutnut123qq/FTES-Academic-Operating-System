import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { MutateBuyStreakFreezeResponse } from "./types/buy-streak-freeze"

const mutation1 = gql`
  mutation BuyStreakFreeze {
    buyStreakFreeze {
      success
      message
      error
      data {
        streakFreezes
        points
      }
    }
  }
`

export enum MutationBuyStreakFreeze {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationBuyStreakFreeze, DocumentNode> = {
    [MutationBuyStreakFreeze.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateBuyStreakFreeze} (no request body). */
export type MutateBuyStreakFreezeParams = Omit<
    MutateParams<MutationBuyStreakFreeze, never>,
    "request"
> & { request?: never }

/**
 * Buys one streak freeze (costs 100 points, capped at 3 owned). A freeze keeps
 * the streak alive when the viewer misses a single day. Mirrors `buyStreakFreeze`
 * (mutations/dashboard/buy-streak-freeze).
 */
export const mutateBuyStreakFreeze = async ({
    mutation = MutationBuyStreakFreeze.Mutation1,
    debug,
    signal,
}: MutateBuyStreakFreezeParams = {}) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateBuyStreakFreezeResponse>({
        mutation: mutationMap[mutation],
    })
}
