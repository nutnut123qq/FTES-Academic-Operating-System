import {
    OauthAction,
} from "./enums"

/**
 * Maps each OAuth lifecycle step to its i18n key under `auth.oauth`, used as the
 * message rendered beneath the spinner on every OAuth redirect page.
 */
export const OAUTH_ACTION_MESSAGE_KEY_MAP: Record<OauthAction, string> = {
    [OauthAction.Authenticate]: "auth.oauth.authenticating",
    [OauthAction.Login]: "auth.oauth.signingIn",
    [OauthAction.Logout]: "auth.oauth.signingOut",
}
