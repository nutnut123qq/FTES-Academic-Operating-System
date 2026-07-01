import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SetAiCeilRequest, MutateSetAiCeilResponse } from "./types/set-ai-ceil"

const mutation1 = gql`
  mutation SetAiCeil($request: SetAiCeilRequest!) {
    setAiCeil(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationSetAiCeil {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSetAiCeil, DocumentNode> = {
    [MutationSetAiCeil.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSetAiCeil}. */
export type MutateSetAiCeilParams = MutateParams<
    MutationSetAiCeil,
    SetAiCeilRequest
>

/**
 * Sets the current user's AI model CEILING for a surface (or the global default
 * when `surface` is omitted) — the per-hạng-mục cap for cost control. Clients
 * refetch `myAiQuota` after to read the refreshed state.
 *
 * Mirrors backend `setAiCeil` (mutations/ai/set-ai-ceil/set-ai-ceil.resolver.ts).
 */
export const mutateSetAiCeil = async ({
    mutation = MutationSetAiCeil.Mutation1,
    request,
    debug,
    signal,
}: MutateSetAiCeilParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateSetAiCeilResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
