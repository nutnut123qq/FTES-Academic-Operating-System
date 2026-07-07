/**
 * Request / response shapes for the auth REST endpoints (`/api/v1/auth/*`).
 *
 * These mirror the backend records in
 * `vn.ftes.aos.identity.auth.web.dto.AuthDtos` (LoginRequest / TokenResponse /
 * RegisterRequest / MessageResponse). Every backend response is wrapped in the
 * standard `{code, message, data}` envelope; the shapes below describe the
 * already-unwrapped `data` payload returned by `restRequest`.
 */

/** Body sent to `POST /api/v1/auth/login`. */
export interface KeycloakLoginRequest {
    /** Username OR email — the backend accepts either as the login identifier. */
    identifier: string
    /** Plain-text password. */
    password: string
    /** Optional human-readable device description. */
    deviceInfo?: string
    /** Optional device fingerprint for fraud / risk signals. */
    deviceFingerprint?: string
    /** Optional captcha token when risk checks require it. */
    captchaToken?: string
}

/** Token payload returned on successful login (unwrapped from the envelope `data`). */
export interface KeycloakLoginResponse {
    /** Access token (JWT). Absent when `mfaRequired` is true. */
    accessToken?: string
    /** Refresh token. Absent when `mfaRequired` is true. */
    refreshToken?: string
    /** Access token lifetime in seconds. */
    expiresIn?: number
    /** Refresh token lifetime in seconds. */
    refreshExpiresIn?: number
    /** Token type, e.g. "Bearer". */
    tokenType?: string
    /** True when the login flow requires an MFA challenge before tokens are issued. */
    mfaRequired?: boolean
    /** MFA challenge id to pass to `POST /api/v1/auth/mfa/verify`. */
    challengeId?: string
}

/** Body sent to `POST /api/v1/auth/register`. */
export interface KeycloakRegisterRequest {
    /** Username (3-64 chars) — defaults to email when not provided by the caller. */
    username: string
    /** User email address. */
    email: string
    /** Plain-text password (policy enforced server-side). */
    password: string
    /** First name — accepted for FE convenience; NOT sent to the backend. */
    firstName?: string | null
    /** Last name — accepted for FE convenience; NOT sent to the backend. */
    lastName?: string | null
    /** Whether to send a verification email — accepted for FE convenience; NOT sent to the backend. */
    sendVerifyEmail?: boolean
}

/** Payload returned on successful registration (backend `MessageResponse`). */
export interface KeycloakRegisterResponse {
    /** Acknowledgement status — always "ok" on success. */
    status: string
}
