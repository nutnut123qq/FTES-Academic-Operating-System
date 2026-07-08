import axios from "axios"
import { publicEnv } from "@/resources/env/public"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type { RestApiResponse, RestErrorBody, RestRequestConfig } from "./types"

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
 *   `code` is not 200.
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
        // (vd close/join/manual-scores trả ApiResponse.ok(null)). Chỉ code khác 200 mới là lỗi.
        if (envelope.code !== 200) {
            const errorBody = envelope.data as unknown as RestErrorBody | undefined
            const errorCode = errorBody?.errorCode
            const message = [envelope.message, errorCode].filter(Boolean).join(" — ")
            throw new Error(message || "REST request failed")
        }

        // data có thể null hợp lệ (endpoint void) — caller khai T=void cho các call đó.
        return envelope.data as T
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const envelope = error.response.data as RestApiResponse<RestErrorBody> | undefined
            const errorBody = envelope?.data
            const message = [envelope?.message, errorBody?.errorCode, errorBody?.traceId]
                .filter(Boolean)
                .join(" — ")
            throw new Error(message || error.message || "REST request failed")
        }

        throw error instanceof Error ? error : new Error(String(error))
    }
}
