/**
 * How the user signed up / signs in (provider = login method). Mirrors the
 * backend `AuthenticationType` enum; drives the "login method" badge in settings.
 */
export enum AuthenticationType {
    /** Signed in with a GitHub account (auto-links the GitHub identity). */
    Github = "github",
    /** Signed in with a Google account. */
    Google = "google",
    /** Signed in with email + password (username/password credentials). */
    Credentials = "credentials",
}
