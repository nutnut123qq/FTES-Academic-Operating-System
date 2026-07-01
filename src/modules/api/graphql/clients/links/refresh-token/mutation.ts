import { DocumentNode, gql } from "@apollo/client"
import { createRefreshTokenApolloClient } from "./client"
import { GraphQLResponse, MutateParams } from "../../../types"

export enum MutationRefreshToken {
    Mutation1 = "mutation1",
}

export const mutation1 = gql`
  mutation RefreshToken($request: RefreshTokenRequest!) {
    refreshToken(request: $request) {
      success
      message
      error
      data {
        accessToken
      }
    }
  }
`

/**
 * The refresh token mutation map.
 */
const mutationMap: Record<MutationRefreshToken, DocumentNode> = {
    [MutationRefreshToken.Mutation1]: mutation1,
}


/**
 * The refresh token mutation request.
 */
export interface RefreshTokenRequest {
    /** 
     * Minimum validity seconds.
     */
    minValiditySeconds?: number
}

export interface RefreshTokenData {
    accessToken: string
}
/**
 * The refresh token mutation response.
 */
export interface MutateRefreshTokenResponse {   
    refreshToken: GraphQLResponse<RefreshTokenData>
}

/**
 * The refresh token mutation variables.
 */
export interface RefreshTokenVariables {
    request: RefreshTokenRequest
}

/**
 * The refresh token mutation.
 */
/** Performs one refresh mutation on a dedicated, throwaway Apollo client. */
const sendRefreshToken = ({
    mutation = MutationRefreshToken.Mutation1,
    request,
    debug,
    signal,
}: MutateParams<MutationRefreshToken, RefreshTokenRequest>) => {
    const apollo = createRefreshTokenApolloClient({
        debug,
        signal,
    })
    return apollo.mutate<MutateRefreshTokenResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}

/**
 * In-flight refresh shared across concurrent callers (single-flight).
 *
 * The proactive-refresh link awaits a refresh before EVERY operation when the
 * token is near expiry, so firing N queries at once would otherwise spawn N
 * parallel refreshes — wasteful, and worse: each one rotates the server CSRF
 * cookie out from under its siblings, producing "CSRF token mismatch". While a
 * refresh is in flight, everyone shares the same promise.
 */
let inFlightRefresh: ReturnType<typeof sendRefreshToken> | null = null

/**
 * The refresh token mutation. Coalesces overlapping calls into one network
 * refresh; the next near-expiry after it settles triggers a fresh one.
 */
export const mutateRefreshToken = (
    params: MutateParams<MutationRefreshToken, RefreshTokenRequest>,
) => {
    // join the in-flight refresh instead of starting a competing one
    if (inFlightRefresh) {
        return inFlightRefresh
    }
    inFlightRefresh = sendRefreshToken(params).finally(() => {
        // release once settled so a later expiry can refresh again
        inFlightRefresh = null
    })
    return inFlightRefresh
}
