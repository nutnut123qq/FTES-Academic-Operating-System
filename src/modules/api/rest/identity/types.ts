/**
 * Request/response DTOs for the identity/auth REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.identity.auth.web.dto.AuthDtos`.
 */

// ---------------------------------------------------------------- Registration & verification

/** Body sent to `POST /api/v1/auth/register`. */
export interface RegisterRequest {
    /** User email address (required, valid email, <=255). */
    email: string
    /** Plain-text password (required, >=8 chars, must contain letter+digit). */
    password: string
    /** Optional display name (<=128) — becomes the profile displayName. */
    fullName?: string
    /** Optional legacy username (3-64); omitted => derived from the email local-part. */
    username?: string
}

/**
 * Body sent to `POST /api/v1/auth/register/verify`.
 *
 * On success the endpoint returns the exact same {@link TokenResponse} as
 * `POST /auth/login` (account activated + session created).
 */
export interface RegisterVerifyRequest {
    /** Email the OTP was sent to. */
    email: string
    /** Six-digit OTP code from the email (max 5 wrong attempts). */
    otp: string
    /** Optional human-readable device description (shown in the session list). */
    deviceInfo?: string
}

/** Body sent to `POST /api/v1/auth/verify-email`. */
export interface VerifyEmailRequest {
    /** Verification token from the email link. */
    token: string
}

/** Body sent to `POST /api/v1/auth/resend-verification`. */
export interface ResendVerificationRequest {
    /** User email address. */
    email: string
}

// ---------------------------------------------------------------- Login

/** Body sent to `POST /api/v1/auth/login`. */
export interface LoginRequest {
    /** Username or email address. */
    identifier: string
    /** Plain-text password. */
    password: string
    /** Optional human-readable device description. */
    deviceInfo?: string
    /** Optional device fingerprint for fraud/risk signals. */
    deviceFingerprint?: string
    /** Optional captcha token when risk checks require it. */
    captchaToken?: string
}

/** Token pair returned on successful login or refresh. */
export interface TokenResponse {
    /** Access token (JWT). */
    accessToken?: string
    /** Refresh token. */
    refreshToken?: string
    /** Access token lifetime in seconds. */
    expiresIn?: number
    /** Refresh token lifetime in seconds. */
    refreshExpiresIn?: number
    /** Token type, e.g. "Bearer". */
    tokenType?: string
    /** True when the login flow requires MFA challenge verification. */
    mfaRequired?: boolean
    /** MFA challenge ID to pass to `/auth/mfa/verify`. */
    challengeId?: string
}

/** Body sent to `POST /api/v1/auth/mfa/verify`. */
export interface MfaVerifyRequest {
    /** MFA challenge ID returned from login. */
    challengeId: string
    /** TOTP code from the authenticator app. */
    code: string
}

/** Body sent to `POST /api/v1/auth/google`. */
export interface GoogleLoginRequest {
    /** Google ID token. */
    idToken: string
}

// ---------------------------------------------------------------- OTP

/** Body sent to `POST /api/v1/auth/otp/request`. */
export interface OtpRequestRequest {
    /** OTP channel, e.g. "email" or "sms". */
    channel: string
    /** OTP purpose, e.g. "signup" or "reset_password". */
    purpose: string
    /** Target address (email or phone), optional depending on channel. */
    target?: string
}

/** Body sent to `POST /api/v1/auth/otp/verify`. */
export interface OtpVerifyRequest {
    /** OTP channel. */
    channel: string
    /** OTP purpose. */
    purpose: string
    /** Target address. */
    target: string
    /** Six-digit OTP code. */
    code: string
}

// ---------------------------------------------------------------- Password recovery

/** Body sent to `POST /api/v1/auth/forgot-password`. */
export interface ForgotPasswordRequest {
    /** User email address. */
    email: string
}

/** Body sent to `POST /api/v1/auth/reset-password`. */
export interface ResetPasswordRequest {
    /** Reset token from the email link. */
    token: string
    /** New plain-text password (policy enforced server-side). */
    newPassword: string
}

/** Body sent to `POST /api/v1/auth/refresh`. */
export interface RefreshRequest {
    /** Refresh token. */
    refreshToken: string
}

/** Body sent to `PUT /api/v1/identity/password`. */
export interface ChangePasswordRequest {
    /** Current password. */
    currentPassword: string
    /** New password. */
    newPassword: string
}

// ---------------------------------------------------------------- Sessions

/** One active session for the current user. */
export interface SessionView {
    /** Session id. */
    sid: string
    /** Device/user-agent description. */
    deviceInfo?: string
    /** Client IP captured at login/last use. */
    ip?: string
    /** Session creation timestamp (ISO-8601). */
    createdAt?: string
    /** Last-activity timestamp (ISO-8601). */
    lastUsedAt?: string
    /** True when this is the session making the current request. */
    current: boolean
}

// ---------------------------------------------------------------- MFA management

/** Response from `GET /api/v1/identity/mfa`. */
export interface MfaStatusResponse {
    /** True when TOTP MFA is active for the current user. */
    totpEnabled: boolean
}

/** Response from `POST /api/v1/identity/mfa/totp/enroll`. */
export interface MfaEnrollResponse {
    /** Base32 shared secret. */
    secret: string
    /** `otpauth://` provisioning URI for QR-code generation. */
    otpauthUri: string
}

/** Body sent to `POST /api/v1/identity/mfa/totp/activate`. */
export interface MfaActivateRequest {
    /** Six-digit TOTP code to confirm enrollment. */
    code: string
}

/** Response from `POST /api/v1/identity/mfa/totp/activate`. */
export interface MfaActivateResponse {
    /** Single-use recovery codes. */
    recoveryCodes: Array<string>
}

/** Body sent to `DELETE /api/v1/identity/mfa/totp`. */
export interface MfaDisableRequest {
    /** Optional TOTP code (may be required when policy demands it). */
    code?: string
    /** Optional current password (may be required when policy demands it). */
    password?: string
}

// ---------------------------------------------------------------- Generic ack

/** Generic "ok" response body used by several void-ish endpoints. */
export interface MessageResponse {
    /** Always "ok" on success. */
    status: string
}
