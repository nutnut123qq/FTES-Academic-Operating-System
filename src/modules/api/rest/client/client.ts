import axios from "axios"
import { publicEnv } from "@/resources/env/public"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type { RestApiResponse, RestErrorBody, RestRequestConfig } from "./types"

/**
 * Error thrown by {@link restRequest} on any non-2xx / non-`code:{200,1002}` response.
 *
 * A plain `Error` subclass — `.message` is identical to the legacy throw, so every
 * existing `catch`/`.message` consumer keeps working — augmented with the HTTP
 * `status` and backend `errorCode` so callers can branch (e.g. `401/403` →
 * entitlement invitation vs `5xx`/network → transient error).
 */
export class RestError extends Error {
    /** HTTP status code (0 when no response reached, e.g. a network failure). */
    readonly status: number
    /** Backend domain error code (e.g. `COURSE_FORBIDDEN`), when present. */
    readonly errorCode?: string

    constructor(message: string, status: number, errorCode?: string) {
        super(message)
        this.name = "RestError"
        this.status = status
        this.errorCode = errorCode
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
 * Executes a single REST request against the backend and unwraps the standard
 * `{code,message,data}` envelope.
 *
 * - Attaches `Authorization: Bearer <token>` whenever a token exists in local storage
 *   (any method), unless a call explicitly opts out with `authenticated: false`. Public
 *   endpoints ignore a stale/invalid token, so always sending it is safe and prevents
 *   authenticated GETs (streak, lesson content, /me/*, admin reads) from silently 401ing.
 * - Creates a fresh axios instance per call.
 * - Throws an `Error` when the HTTP status is not 2xx or when the backend envelope
 *   `code` is neither 200 nor 1002 (1002 = "Accepted" async-job submit, data = JobRef).
 *
 * @param config - Axios request config plus optional `authenticated` override.
 * @returns The unwrapped `data` payload on success.
 */
export const restRequest = async <T>(config: RestRequestConfig): Promise<T> => {
    const axiosInstance = createRestAxiosInstance()
    const shouldAuthenticate = config.authenticated ?? true

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
            const message = [envelope.message, errorCode].filter(Boolean).join(" — ")
            throw new RestError(message || "REST request failed", envelope.code, errorCode)
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
            const message = [envelope?.message, errorCode, errorBody?.traceId]
                .filter(Boolean)
                .join(" — ")
            throw new RestError(
                message || error.message || "REST request failed",
                error.response.status,
                errorCode,
            )
        }

        throw error instanceof Error ? error : new Error(String(error))
    }
}
