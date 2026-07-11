import { restRequest } from "@/modules/api/rest/client"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { GraphQLResponse, MutateParams } from "../../../types"

/**
 * Token refresh.
 *
 * The BE GraphQL gateway is **query-only** (no `type Mutation`), so refresh CANNOT
 * go through GraphQL. Instead we mint a new access token via REST
 * `POST /api/v1/auth/refresh` using the refresh token persisted at login
 * ({@link LocalStorageId.KeycloakRefreshToken}). The return shape is kept identical
 * to the previous Apollo mutation result (`{ data: { refreshToken: { data:
 * { accessToken } } } }`) so existing callers (the proactive-refresh link) are
 * unchanged.
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

/** Unwrapped `data` payload of `POST /api/v1/auth/refresh` (mirrors BE `TokenResponse`). */
interface RefreshRestResponse {
    accessToken?: string
    refreshToken?: string
}

const emptyResult = (error: string): RefreshResult => ({
    data: { refreshToken: { success: false, message: "", error, data: undefined } },
})

/** Performs one REST refresh: reads the stored refresh token, mints a new access token,
 *  persists the (rotated) tokens, and returns the Apollo-compatible result. */
const doRefresh = async (): Promise<RefreshResult> => {
    const refreshToken = LocalStorage.getItemAsString(LocalStorageId.KeycloakRefreshToken)
    // No refresh session (e.g. anonymous, or an injected access-token-only session) →
    // caller's optional chaining no-ops and the request is forwarded unauthenticated.
    if (!refreshToken) return emptyResult("no refresh token")

    const resp = await restRequest<RefreshRestResponse>({
        method: "POST",
        url: "/auth/refresh",
        data: { refreshToken },
        // Public endpoint — never attach the (stale/expiring) bearer token.
        authenticated: false,
    })

    if (resp?.accessToken) {
        LocalStorage.setItem(LocalStorageId.KeycloakAccessToken, resp.accessToken)
    }
    // The BE rotates the refresh token on each refresh — persist the new one so the
    // next refresh doesn't reuse a consumed token.
    if (resp?.refreshToken) {
        LocalStorage.setItem(LocalStorageId.KeycloakRefreshToken, resp.refreshToken)
    }

    return {
        data: {
            refreshToken: {
                success: Boolean(resp?.accessToken),
                message: "",
                error: undefined,
                data: resp?.accessToken ? { accessToken: resp.accessToken } : undefined,
            },
        },
    }
}

/**
 * In-flight refresh shared across concurrent callers (single-flight).
 *
 * The proactive-refresh link awaits a refresh before EVERY operation when the token
 * is near expiry, so firing N queries at once would otherwise spawn N parallel
 * refreshes — wasteful, and worse: each one would rotate the refresh token out from
 * under its siblings, invalidating them. While a refresh is in flight, everyone
 * shares the same promise.
 */
let inFlightRefresh: Promise<RefreshResult> | null = null

/**
 * The refresh token operation. Coalesces overlapping calls into one network refresh;
 * the next near-expiry after it settles triggers a fresh one. A failed refresh
 * resolves to an empty result (never rejects) so callers treat it as non-fatal and
 * forward the request anyway (the server enforces auth where it matters).
 */
export const mutateRefreshToken = (
    _params?: MutateParams<MutationRefreshToken, RefreshTokenRequest>,
): Promise<RefreshResult> => {
    if (inFlightRefresh) return inFlightRefresh
    inFlightRefresh = doRefresh()
        .catch((error): RefreshResult => emptyResult(String(error)))
        .finally(() => {
            inFlightRefresh = null
        })
    return inFlightRefresh
}
