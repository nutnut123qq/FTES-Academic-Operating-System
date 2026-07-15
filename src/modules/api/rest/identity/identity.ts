import { restRequest } from "@/modules/api/rest/client"
import type {
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleLoginRequest,
    MessageResponse,
    MfaActivateRequest,
    MfaActivateResponse,
    MfaDisableRequest,
    MfaEnrollResponse,
    MfaStatusResponse,
    MfaVerifyRequest,
    OtpRequestRequest,
    OtpVerifyRequest,
    RegisterRequest,
    RegisterVerifyRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    SessionView,
    TokenResponse,
    VerifyEmailRequest,
} from "./types"

// ---------------------------------------------------------------- AuthController (public flows)

/**
 * Registers a new account and dispatches a 6-digit OTP email.
 *
 * Behavior: new email => account `PENDING_VERIFICATION` + OTP email (TTL 5m, cooldown 60s);
 * email exists UNVERIFIED => 200 idempotent OTP resend (so "resend OTP" = call this again);
 * email exists ACTIVE => 409 `IDENTITY_EMAIL_TAKEN`.
 *
 * `POST /api/v1/auth/register`
 */
export const register = async (request: RegisterRequest): Promise<MessageResponse> => {
    return restRequest<MessageResponse>({
        method: "POST",
        url: "/auth/register",
        data: request,
    })
}

/**
 * Verifies the registration OTP and activates the account.
 *
 * On success the response is IDENTICAL to `POST /auth/login` (token pair + session),
 * so the user is signed in immediately.
 *
 * `POST /api/v1/auth/register/verify`
 */
export const verifyRegistration = async (
    request: RegisterVerifyRequest,
): Promise<TokenResponse> => {
    return restRequest<TokenResponse>({
        method: "POST",
        url: "/auth/register/verify",
        data: request,
    })
}

/**
 * Verifies a user's email address using the token from the verification email.
 *
 * `POST /api/v1/auth/verify-email`
 */
export const verifyEmail = async (request: VerifyEmailRequest): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/auth/verify-email",
        data: request,
    })
}

/**
 * Resends the verification email for a given email address.
 *
 * `POST /api/v1/auth/resend-verification`
 */
export const resendVerificationEmail = async (
    request: ResendVerificationRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/auth/resend-verification",
        data: request,
    })
}

/**
 * Verifies an MFA challenge returned by the login flow.
 *
 * `POST /api/v1/auth/mfa/verify`
 */
export const verifyMfaChallenge = async (
    request: MfaVerifyRequest,
): Promise<TokenResponse> => {
    return restRequest<TokenResponse>({
        method: "POST",
        url: "/auth/mfa/verify",
        data: request,
    })
}

/**
 * Logs in with a Google ID token.
 *
 * `POST /api/v1/auth/google`
 */
export const loginWithGoogle = async (
    request: GoogleLoginRequest,
): Promise<TokenResponse> => {
    return restRequest<TokenResponse>({
        method: "POST",
        url: "/auth/google",
        data: request,
    })
}

/**
 * Requests a one-time password (OTP) for the given channel and purpose.
 *
 * `POST /api/v1/auth/otp/request`
 */
export const requestOtp = async (request: OtpRequestRequest): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/auth/otp/request",
        data: request,
    })
}

/**
 * Verifies a one-time password (OTP).
 *
 * `POST /api/v1/auth/otp/verify`
 */
export const verifyOtp = async (request: OtpVerifyRequest): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/auth/otp/verify",
        data: request,
    })
}

/**
 * Requests a password-reset email for the given email address.
 *
 * `POST /api/v1/auth/forgot-password`
 */
export const requestPasswordReset = async (
    request: ForgotPasswordRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/auth/forgot-password",
        data: request,
    })
}

/**
 * Resets the password using the token from the reset email.
 *
 * `POST /api/v1/auth/reset-password`
 */
export const resetPassword = async (
    request: ResetPasswordRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/auth/reset-password",
        data: request,
    })
}

// ---------------------------------------------------------------- MfaController (authenticated)

/**
 * Returns the current user's MFA status.
 *
 * `GET /api/v1/identity/mfa`
 */
export const getMfaStatus = async (): Promise<MfaStatusResponse> => {
    return restRequest<MfaStatusResponse>({
        method: "GET",
        url: "/identity/mfa",
        authenticated: true,
    })
}

/**
 * Enrolls the current user in TOTP MFA and returns a secret + provisioning URI.
 *
 * `POST /api/v1/identity/mfa/totp/enroll`
 */
export const enrollMfaTotp = async (): Promise<MfaEnrollResponse> => {
    return restRequest<MfaEnrollResponse>({
        method: "POST",
        url: "/identity/mfa/totp/enroll",
    })
}

/**
 * Activates TOTP MFA for the current user using a confirmation code.
 *
 * `POST /api/v1/identity/mfa/totp/activate`
 */
export const activateMfaTotp = async (
    request: MfaActivateRequest,
): Promise<MfaActivateResponse> => {
    return restRequest<MfaActivateResponse>({
        method: "POST",
        url: "/identity/mfa/totp/activate",
        data: request,
    })
}

/**
 * Disables TOTP MFA for the current user.
 *
 * `DELETE /api/v1/identity/mfa/totp`
 */
export const disableMfaTotp = async (
    request?: MfaDisableRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: "/identity/mfa/totp",
        data: request,
    })
}

// ---------------------------------------------------------------- PasswordController (authenticated)

/**
 * Changes the current user's password.
 *
 * `PUT /api/v1/identity/password`
 */
export const changePassword = async (
    request: ChangePasswordRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: "/identity/password",
        data: request,
    })
}

// ---------------------------------------------------------------- SessionController (authenticated)

/**
 * Lists the current user's active sessions.
 *
 * `GET /api/v1/identity/sessions`
 */
export const listSessions = async (): Promise<Array<SessionView>> => {
    return restRequest<Array<SessionView>>({
        method: "GET",
        url: "/identity/sessions",
        authenticated: true,
    })
}

/**
 * Revokes a single session by its session id.
 *
 * `DELETE /api/v1/identity/sessions/{sid}`
 */
export const revokeSession = async (sid: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/identity/sessions/${sid}`,
    })
}

/**
 * Revokes all sessions for the current user.
 *
 * `DELETE /api/v1/identity/sessions?keepCurrent={keepCurrent}`
 */
export const revokeAllSessions = async (
    keepCurrent = false,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: "/identity/sessions",
        params: { keepCurrent },
    })
}
