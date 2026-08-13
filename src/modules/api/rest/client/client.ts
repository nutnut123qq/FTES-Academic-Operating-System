import axios from "axios"
import { publicEnv } from "@/resources/env/public"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { refreshAccessToken, shouldRefreshAccessToken } from "./refresh"
import { handleSessionRevoked, isSessionRevokedError } from "./session-revoked"
import type { RestApiResponse, RestErrorBody, RestRequestConfig } from "./types"

/**
 * Error thrown by {@link restRequest} on any non-2xx / non-`code:{200,1002}` response.
 *
 * A plain `Error` subclass augmented with the HTTP `status`, the backend `errorCode`
 * and the full error `body`, so callers can branch (e.g. `401/403` → entitlement
 * invitation vs `5xx`/network → transient error).
 *
 * `.message` is the backend `message` ALONE. It used to be the machine details glued
 * onto it (`"Invalid credentials — IDENTITY_INVALID_CREDENTIALS — c04147bb-…"`) — the
 * toast wrappers pass `.message` straight through as the description, so every failure
 * showed the user an error code and a trace uuid. Nothing is lost: the code and the
 * trace id are carried as {@link RestError.errorCode} / {@link RestError.body} for the
 * callers that branch on them.
 *
 * ⚠️ Read the code from `.errorCode`, never by sniffing `.message` for it — a
 * `message.includes("<CODE>")` check silently stops matching now.
 */
export class RestError extends Error {
    /** HTTP status code (0 when no response reached, e.g. a network failure). */
    readonly status: number
    /** Backend domain error code (e.g. `COURSE_FORBIDDEN`), when present. */
    readonly errorCode?: string
    /**
     * Full backend error body (the envelope `data`), when present — carries the
     * contract extras beyond `errorCode` (e.g. `courseId` / `requiredPackageSlugs`
     * on a `CHALLENGE_COURSE_ACCESS_DENIED`) so callers can branch on them.
     */
    readonly body?: RestErrorBody

    constructor(message: string, status: number, errorCode?: string, body?: RestErrorBody) {
        super(message)
        this.name = "RestError"
        this.status = status
        this.errorCode = errorCode
        this.body = body
    }
}

/**
 * Reads the active Keycloak access token from local storage.
 *
 * @returns The bearer token, or `undefined` if none is stored.
 */
const getAccessToken = (): string | undefined => {
    // SSR guard: now that GETs also auth by default, a server-side restRequest must not touch
    // localStorage (would ReferenceError). No token exists server-side anyway.
    if (typeof window === "undefined") return undefined
    return LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken) ?? undefined
}

/**
 * `Authorization` header cho các call KHÔNG đi qua {@link restRequest} — cụ thể là những endpoint
 * trả bytes trần (tải file) mà không dùng envelope JSON. Không có token → object rỗng để endpoint
 * public vẫn gọi được.
 */
export const authHeaders = (): Record<string, string> => {
    const accessToken = getAccessToken()
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

/**
 * Creates a fresh axios instance for a single REST call.
 *
 * The instance is preconfigured with the public HTTP base URL and JSON headers.
 * Callers should not share this instance across requests.
 *
 * @returns A new axios instance.
 */
export const createRestAxiosInstance = () => {
    return axios.create({
        baseURL: publicEnv().api.http,
        headers: { "Content-Type": "application/json" },
    })
}

/**
 * Sends the request ONCE and unwraps the standard `{code,message,data}` envelope.
 *
 * Reads the bearer token FRESH from local storage on every call, so a retry issued
 * after a token refresh automatically picks up the new token. Throws {@link RestError}
 * on any non-2xx / non-`{200,1002}` response. Refresh orchestration lives in
 * {@link restRequest}, which wraps this.
 *
 * @param config - Axios request config plus optional `authenticated` override.
 * @param shouldAuthenticate - Whether to attach `Authorization: Bearer <token>`.
 * @returns The unwrapped `data` payload on success.
 */
const sendRestRequest = async <T>(
    config: RestRequestConfig,
    shouldAuthenticate: boolean,
): Promise<T> => {
    const axiosInstance = createRestAxiosInstance()

    if (shouldAuthenticate) {
        const accessToken = getAccessToken()
        if (accessToken) {
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        }
    }

    try {
        const response = await axiosInstance.request<RestApiResponse<T>>({
            ...config,
            headers: {
                ...axiosInstance.defaults.headers.common,
                ...config.headers,
            },
        })

        const envelope = response.data

        // BE envelope: code=200 = thành công; data nullable NGAY CẢ khi thành công
        // (vd close/join/manual-scores trả ApiResponse.ok(null)). code=1002 = "Accepted"
        // (async job submit — JobController.job trả `ApiResponse.of(1002, "Accepted", JobRef)`;
        // cũng dùng ở TranscriptController + PersonalizeController). Mọi job submit của AI trả
        // 1002 → coi là thành công, data = JobRef. Chỉ code khác {200,1002} mới là lỗi.
        if (envelope.code !== 200 && envelope.code !== 1002) {
            const errorBody = envelope.data as unknown as RestErrorBody | undefined
            const errorCode = errorBody?.errorCode
            throw new RestError(
                envelope.message || "REST request failed",
                envelope.code,
                errorCode,
                errorBody,
            )
        }

        // data có thể null hợp lệ (endpoint void) — caller khai T=void cho các call đó.
        return envelope.data as T
    } catch (error) {
        if (error instanceof RestError) {
            throw error
        }
        if (axios.isAxiosError(error) && error.response) {
            const envelope = error.response.data as RestApiResponse<RestErrorBody> | undefined
            const errorBody = envelope?.data
            const errorCode = errorBody?.errorCode
            throw new RestError(
                envelope?.message || error.message || "REST request failed",
                error.response.status,
                errorCode,
                errorBody ?? undefined,
            )
        }

        throw error instanceof Error ? error : new Error(String(error))
    }
}

/**
 * Executes a REST request against the backend and unwraps the standard
 * `{code,message,data}` envelope, with **silent access-token refresh** around it.
 *
 * The access token is short-lived (15 min). Without refresh, an authenticated call that
 * fires after the token expires — a submit after a long idle stretch, or the first call
 * the morning after — 401s and the user is bounced. Two safety nets wrap the actual send:
 *
 * - **Proactive** — before an authenticated call, if the stored token is missing or
 *   within {@link ACCESS_TOKEN_MIN_VALIDITY_SECONDS} of expiry, refresh it first so we
 *   never send a known-stale bearer.
 * - **Reactive** — if the call 401s anyway (expiry raced the check, or clock skew), do
 *   ONE silent refresh + retry. The BE returns a generic 401 for both expired and
 *   invalid tokens, so we can't pre-distinguish; we retry only when the refresh actually
 *   minted a new token, otherwise the original 401 surfaces (session truly dead → login).
 *
 * Both refresh paths share a single in-flight refresh with the Apollo/GraphQL client
 * (see {@link refreshAccessToken}) so concurrent callers never double-rotate the refresh
 * token. The refresh call itself uses a bare axios instance, so this never recurses.
 *
 * `authenticated: false` calls skip both nets (public endpoints, and the refresh call).
 *
 * @param config - Axios request config plus optional `authenticated` override.
 * @returns The unwrapped `data` payload on success.
 */
export const restRequest = async <T>(config: RestRequestConfig): Promise<T> => {
    const shouldAuthenticate = config.authenticated ?? true

    if (shouldAuthenticate && typeof window !== "undefined") {
        const current = getAccessToken()
        if (current && shouldRefreshAccessToken(current)) {
            await refreshAccessToken()
        }
    }

    try {
        return await sendRestRequest<T>(config, shouldAuthenticate)
    } catch (error) {
        // The session itself is gone (signed out from another device, account locked,
        // refresh-token reuse). Refreshing would fail too — it is the same dead session —
        // so tear the local session down and surface the original error instead of retrying.
        if (isSessionRevokedError(error)) {
            handleSessionRevoked()
            throw error
        }
        if (
            shouldAuthenticate &&
            error instanceof RestError &&
            error.status === 401 &&
            typeof window !== "undefined"
        ) {
            const newAccessToken = await refreshAccessToken()
            if (newAccessToken) {
                return await sendRestRequest<T>(config, shouldAuthenticate)
            }
        }
        throw error
    }
}
