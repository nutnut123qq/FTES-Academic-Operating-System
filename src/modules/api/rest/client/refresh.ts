import axios from "axios"
import jwt from "jsonwebtoken"
import { dayjs } from "@/modules/dayjs"
import { publicEnv } from "@/resources/env/public"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * Minimum remaining validity (seconds) below which the access token is refreshed
 * BEFORE a request goes out.
 *
 * Sized comfortably above zero on purpose: the BE validates `exp` with **no clock-skew
 * leeway** (`Rs256TokenVerifier` compares `exp.before(now)` directly), so a token the
 * client still believes has ~20s left can already be expired on a server whose clock
 * runs slightly ahead. 60s covers skew plus a slow request round-trip.
 */
export const ACCESS_TOKEN_MIN_VALIDITY_SECONDS = 60

/**
 * Returns `true` when `token` is missing, unparseable, already expired, or within
 * `minValiditySeconds` of expiring — i.e. it should be refreshed before use.
 *
 * @param token - The access token to inspect.
 * @param minValiditySeconds - Refresh threshold; defaults to {@link ACCESS_TOKEN_MIN_VALIDITY_SECONDS}.
 */
export const shouldRefreshAccessToken = (
    token: string | undefined,
    minValiditySeconds: number = ACCESS_TOKEN_MIN_VALIDITY_SECONDS,
): boolean => {
    if (!token) return true
    const decoded = jwt.decode(token)
    if (!decoded || typeof decoded === "string") return true
    if (typeof decoded.exp !== "number") return true
    const now = dayjs()
    const expiry = dayjs.unix(decoded.exp)
    if (expiry.isBefore(now)) return true
    return now.add(minValiditySeconds, "second").isAfter(expiry)
}

/** Unwrapped `data` of `POST /api/v1/auth/refresh` (mirrors BE `TokenResponse`). */
interface RefreshTokenPayload {
    accessToken?: string
    refreshToken?: string
}

/** BE `{code,message,data}` envelope for the refresh response. */
interface RefreshEnvelope {
    code: number
    message?: string
    data?: RefreshTokenPayload
}

/**
 * Performs ONE refresh against `POST /auth/refresh` using a **bare** axios call (no
 * bearer header, no interceptors) so it can never recurse back into the authenticated
 * request pipeline. Reads the stored refresh token; on success persists BOTH the new
 * access token and the rotated refresh token (the BE rotates the refresh token on every
 * call, so we must keep the latest or the next refresh trips reuse-detection).
 *
 * @returns The new access token, or `undefined` when there is no refresh session or the
 *   refresh fails. Never throws — a rejected refresh must not crash the request that
 *   triggered it.
 */
const doRefresh = async (): Promise<string | undefined> => {
    if (typeof window === "undefined") return undefined
    const refreshToken = LocalStorage.getItemAsString(LocalStorageId.KeycloakRefreshToken)
    // No refresh session (anonymous, or an access-token-only OAuth session) → nothing to do.
    if (!refreshToken) return undefined

    try {
        const response = await axios.request<RefreshEnvelope>({
            baseURL: publicEnv().api.http,
            url: "/auth/refresh",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Public endpoint — deliberately NO Authorization header (the bearer is stale).
            data: { refreshToken },
        })
        const payload = response.data?.code === 200 ? response.data.data : undefined
        if (payload?.accessToken) {
            LocalStorage.setItem(LocalStorageId.KeycloakAccessToken, payload.accessToken)
        }
        if (payload?.refreshToken) {
            LocalStorage.setItem(LocalStorageId.KeycloakRefreshToken, payload.refreshToken)
        }
        return payload?.accessToken
    } catch {
        // Expired / rotated-away / reused refresh token, or a network failure. Non-fatal
        // here: the caller decides whether to surface the 401 or send the user to login.
        return undefined
    }
}

/**
 * In-flight refresh shared across EVERY caller — the REST client (proactive + reactive)
 * AND the Apollo proactive-refresh link (via {@link mutateRefreshToken}).
 *
 * Concurrent near-expiry checks / 401s MUST coalesce into ONE network refresh: the BE
 * rotates the refresh token on each call and flags reuse, so two parallel refreshes
 * would rotate each other out and trip reuse-detection → whole-session revocation. While
 * a refresh is in flight, every caller shares the same promise.
 */
let inFlightRefresh: Promise<string | undefined> | null = null

/**
 * Refreshes the access token, coalescing overlapping calls into a single network
 * refresh. Resolves to the new access token, or `undefined` on failure (never rejects).
 */
export const refreshAccessToken = (): Promise<string | undefined> => {
    if (inFlightRefresh) return inFlightRefresh
    inFlightRefresh = doRefresh().finally(() => {
        inFlightRefresh = null
    })
    return inFlightRefresh
}
