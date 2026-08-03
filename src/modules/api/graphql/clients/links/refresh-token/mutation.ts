import { refreshAccessToken } from "@/modules/api/rest/client/refresh"
import { GraphQLResponse } from "../../../types"

/**
 * Token refresh (Apollo-facing wrapper).
 *
 * The BE GraphQL gateway is **query-only** (no `type Mutation`), so refresh CANNOT go
 * through GraphQL. The actual refresh — reading the stored refresh token, calling REST
 * `POST /api/v1/auth/refresh`, persisting the rotated tokens, and coalescing concurrent
 * callers into ONE network refresh — lives in {@link refreshAccessToken}
 * (`@/modules/api/rest/client/refresh`), shared with the REST client so both stacks
 * never double-rotate the refresh token. This module only re-wraps the result into the
 * Apollo-compatible shape (`{ data: { refreshToken: { data: { accessToken } } } }`) so
 * existing callers (the proactive-refresh link) are unchanged.
 */
export enum MutationRefreshToken {
    Mutation1 = "mutation1",
}

/** Request kept for signature compatibility; `minValiditySeconds` is unused by REST refresh. */
export interface RefreshTokenRequest {
    /** Minimum validity seconds (unused — the BE decides token lifetime). */
    minValiditySeconds?: number
}

export interface RefreshTokenData {
    accessToken: string
}

/** Response mirrors the previous Apollo mutation payload. */
export interface MutateRefreshTokenResponse {
    refreshToken: GraphQLResponse<RefreshTokenData>
}

export interface RefreshTokenVariables {
    request: RefreshTokenRequest
}

/** Result envelope handed back to callers (mirrors Apollo `FetchResult`). */
export interface RefreshResult {
    data: MutateRefreshTokenResponse | null
}

/**
 * The refresh token operation. Delegates to the shared single-flight
 * {@link refreshAccessToken} (which persists the rotated tokens and coalesces
 * overlapping calls across BOTH the REST and GraphQL stacks) and re-wraps the new access
 * token into the Apollo-compatible result. A failed refresh resolves to a `success:false`
 * result (never rejects) so callers treat it as non-fatal and forward the request anyway
 * (the server enforces auth where it matters).
 */
export const mutateRefreshToken = async (): Promise<RefreshResult> => {
    const accessToken = await refreshAccessToken()
    return {
        data: {
            refreshToken: {
                success: Boolean(accessToken),
                message: "",
                error: accessToken ? undefined : "refresh failed",
                data: accessToken ? { accessToken } : undefined,
            },
        },
    }
}
