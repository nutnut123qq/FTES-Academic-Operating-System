/**
 * Request / response shapes for the Keycloak auth REST endpoints.
 */

/** Body sent to `POST /api/v1/keycloak/auth/login`. */
export interface KeycloakLoginRequest {
    /** Username used as login credential. */
    username: string
    /** Plain-text password. */
    password: string
}

/** Payload returned on successful login. */
export interface KeycloakLoginResponse {
    /** Keycloak access token. */
    accessToken: string
    /** Keycloak refresh token. */
    refreshToken: string
    /** Token expiry in seconds. */
    expiresIn: number
}

/** Body sent to `POST /api/v1/keycloak/auth/register`. */
export interface KeycloakRegisterRequest {
    /** Username — defaults to email when not provided. */
    username: string
    /** User email address. */
    email: string
    /** Plain-text password. */
    password: string
    /** First name (nullable). */
    firstName: string | null
    /** Last name (nullable). */
    lastName: string | null
    /** Whether to send a verification email. */
    sendVerifyEmail: boolean
}

/** Payload returned on successful registration. */
export interface KeycloakRegisterResponse {
    /** Newly created Keycloak user ID. */
    userId: string
}
