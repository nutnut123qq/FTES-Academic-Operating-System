import { restRequest } from "@/modules/api/rest/client"
import type {
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GithubCodeRequest,
    GoogleLoginRequest,
    IdentityMe,
    LinkedAccount,
    LinkedAccountProvider,
    MessageResponse,
    MfaActivateRequest,
    MfaActivateResponse,
    MfaDisableRequest,
    MfaEmailRequest,
    MfaEnrollResponse,
    MfaStatusResponse,
    MfaVerifyRequest,
    UnlockAppealRequest,
    OtpRequestRequest,
    OtpVerifyRequest,
    RegisterRequest,
    RegisterVerifyRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    SessionView,
    SetPasswordRequest,
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
 * Submits an appeal to unlock a locked account.
 *
 * Authenticated by the ACCOUNT PASSWORD, not a bearer token: locking revokes every session, so the
 * person who needs to appeal is exactly the person with no token to send. The backend verifies the
 * credentials the same way login does and rate-limits the endpoint on its own bucket.
 *
 * `POST /api/v1/auth/appeals`
 */
export const submitUnlockAppeal = async (request: UnlockAppealRequest): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/auth/appeals",
        data: request,
        // Public endpoint by necessity — attaching the dead token would only invite a 401 detour.
        authenticated: false,
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
 * Logs in (or signs up on first use) with a GitHub OAuth authorization code.
 *
 * The shape mirrors {@link loginWithGoogle}: a public endpoint that returns the same
 * {@link TokenResponse} token pair. The FE obtains `code` via the GitHub redirect flow
 * and posts it here from the callback route (no session required).
 *
 * `POST /api/v1/auth/github`
 */
export const loginWithGithub = async (
    request: GithubCodeRequest,
): Promise<TokenResponse> => {
    return restRequest<TokenResponse>({
        method: "POST",
        url: "/auth/github",
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

/**
 * Enables email-OTP MFA for the current user. Requires the current password —
 * a bearer token alone must not be able to change a second factor.
 *
 * Added by the backend change `identity-session-liveness-email-2fa`; on a backend
 * without it the call 404s, which is why the settings UI gates the control on
 * `emailOtpEnabled` being reported at all by {@link getMfaStatus}.
 *
 * `POST /api/v1/identity/mfa/email/enable`
 */
export const enableMfaEmail = async (request: MfaEmailRequest): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/identity/mfa/email/enable",
        data: request,
    })
}

/**
 * Disables email-OTP MFA for the current user. Requires the current password.
 *
 * `DELETE /api/v1/identity/mfa/email`
 */
export const disableMfaEmail = async (request: MfaEmailRequest): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: "/identity/mfa/email",
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

// ---------------------------------------------------------------- Account / federated linking (authenticated)

/**
 * Returns the caller's identity snapshot, including whether a password credential exists.
 *
 * The forced-set-password gate reads `hasPassword`: right after a Google/GitHub login the
 * FE calls this and, when `false`, makes the user create a password before proceeding.
 *
 * `GET /api/v1/identity/me`
 */
export const getIdentityMe = async (): Promise<IdentityMe> => {
    return restRequest<IdentityMe>({
        method: "GET",
        url: "/identity/me",
        authenticated: true,
    })
}

/**
 * Creates a password for an account that has none (a federated-only login).
 *
 * Returns 409 `IDENTITY_CREDENTIAL_ALREADY_SET` when the account already has a password —
 * use {@link changePassword} for that case instead.
 *
 * `POST /api/v1/identity/password/set`
 */
export const setPassword = async (
    request: SetPasswordRequest,
): Promise<MessageResponse> => {
    return restRequest<MessageResponse>({
        method: "POST",
        url: "/identity/password/set",
        data: request,
    })
}

/**
 * Lists the caller's linked federated identities (Google / GitHub).
 *
 * `GET /api/v1/identity/linked-accounts`
 */
export const getLinkedAccounts = async (): Promise<Array<LinkedAccount>> => {
    return restRequest<Array<LinkedAccount>>({
        method: "GET",
        url: "/identity/linked-accounts",
        authenticated: true,
    })
}

/**
 * Unlinks a federated provider from the caller.
 *
 * Returns 409 `IDENTITY_CANNOT_UNLINK_LAST_LOGIN` when it is the only login method of a
 * passwordless account, and 404 `IDENTITY_IDENTITY_NOT_LINKED` when nothing is linked for
 * that provider.
 *
 * `DELETE /api/v1/identity/linked-accounts/{provider}`
 */
export const unlinkAccount = async (
    provider: LinkedAccountProvider,
): Promise<MessageResponse> => {
    return restRequest<MessageResponse>({
        method: "DELETE",
        url: `/identity/linked-accounts/${provider}`,
    })
}

/**
 * Links a GitHub account to the CURRENT user (no session hand-off — the caller is already
 * authenticated). Uses the same `code` the GitHub redirect flow returns.
 *
 * `POST /api/v1/identity/linked-accounts/github`
 */
export const linkGithub = async (
    request: GithubCodeRequest,
): Promise<MessageResponse> => {
    return restRequest<MessageResponse>({
        method: "POST",
        url: "/identity/linked-accounts/github",
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
