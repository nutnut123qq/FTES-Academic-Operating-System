import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { MutateSignOutResponse } from "./types/sign-out"

const mutation1 = gql`
  mutation SignOut {
    signOut {
      success
      message
      error
    }
  }
`

export enum MutationSignOut {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSignOut, DocumentNode> = {
    [MutationSignOut.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSignOut}. */
export type MutateSignOutParams = MutateParams<MutationSignOut, void>

export const mutateSignOut = async ({
    mutation = MutationSignOut.Mutation1,
    debug,
    signal,
}: MutateSignOutParams) => {
    const apollo = createAuthApolloClient(
        {
            cache: false,
            debug,
            signal,
            withCredentials: true,
        }
    )
    return apollo.mutate<MutateSignOutResponse>({
        mutation: mutationMap[mutation],
    })
}
