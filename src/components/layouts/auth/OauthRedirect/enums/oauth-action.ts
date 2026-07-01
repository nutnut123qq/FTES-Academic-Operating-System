/**
 * The OAuth lifecycle step a redirect page represents — selects the i18n
 * message shown under the spinner while the user is briefly held before being
 * sent home.
 */
export enum OauthAction {
    /** Generic provider hand-off (e.g. Google adapter `init`). */
    Authenticate = "authenticate",
    /** User is being signed in after the provider grant. */
    Login = "login",
    /** User is being signed out after the provider session ends. */
    Logout = "logout",
}
