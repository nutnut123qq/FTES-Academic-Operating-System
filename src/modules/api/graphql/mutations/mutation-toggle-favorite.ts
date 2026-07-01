import { createAuthApolloClient } from "../clients"
import { MutateParams } from "../types"
import { gql } from "@apollo/client"
import type { ToggleFavoriteRequest, MutateToggleFavoriteResponse } from "./types/toggle-favorite"

const mutation = gql`
  mutation ToggleFavourite($request: ToggleFavouriteRequest!) {
    toggleFavourite(request: $request) {
      success
      message
      error
    }
  }
`

/** Apollo params for {@link mutateToggleFavorite}. */
export type MutateToggleFavoriteParams = MutateParams<
    MutateToggleFavoriteResponse,
    ToggleFavoriteRequest
>

export const mutateToggleFavorite = async ({
    request,
    debug,
    headers,
    signal,
}: MutateToggleFavoriteParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        headers,
        signal,
    })
    const result = await apollo.mutate<MutateToggleFavoriteResponse>({
        mutation,
        variables: { request },
    })
    return result.data?.toggleFavourite
}
