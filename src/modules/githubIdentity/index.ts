/**
 * Helpers for the **GitHub OAuth redirect flow**.
 *
 * Unlike Google (which mints an ID token in-page via GIS), GitHub has no first-party
 * browser SDK: we send the user to `https://github.com/login/oauth/authorize`, GitHub
 * redirects back to our callback route with a short-lived `?code`, and the backend
 * exchanges that code (`POST /auth/github` for login, `POST /identity/linked-accounts/github`
 * for linking). This module builds the authorize URL, persists the CSRF `state` + the
 * caller's INTENT (login vs link) across the redirect, and validates them on return.
 */

/** Why the GitHub flow was started — decides which endpoint the callback calls. */
export type GithubAuthIntent = "login" | "link"

/** Locale-less callback path GitHub redirects back to (middleware adds the locale). */
export const GITHUB_CALLBACK_PATH = "/authentication/github/callback"

/** Scopes requested: read the profile + the account's email addresses. */
export const GITHUB_OAUTH_SCOPE = "read:user user:email"

/** GitHub's OAuth authorize endpoint. */
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"

/** sessionStorage key holding the pending `{ state, intent }` for the round trip. */
const PENDING_STORAGE_KEY = "github_oauth_pending"

/** The pending flow snapshot persisted across the redirect. */
interface GithubOAuthPending {
    /** Random anti-CSRF token echoed back by GitHub as `?state`. */
    state: string
    /** Whether this flow logs in or links to the current account. */
    intent: GithubAuthIntent
}

/** Cryptographically-random hex state token (falls back to `Math.random` only if needed). */
const randomState = (): string => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    }
    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
}

/**
 * Starts the GitHub OAuth redirect: persists a fresh `state` + `intent`, then sends the
 * browser to GitHub's authorize page. The `redirect_uri` is `<origin>${GITHUB_CALLBACK_PATH}`
 * — register EXACTLY this (locale-less) URL on the GitHub OAuth App.
 *
 * @param clientId - the GitHub OAuth App client id (`publicEnv().github.clientId`).
 * @param intent - `"login"` to sign in / sign up, `"link"` to attach GitHub to the current user.
 */
export const beginGithubOAuth = (clientId: string, intent: GithubAuthIntent): void => {
    if (typeof window === "undefined" || !clientId) {
        return
    }
    const state = randomState()
    const pending: GithubOAuthPending = { state, intent }
    window.sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending))

    const redirectUri = `${window.location.origin}${GITHUB_CALLBACK_PATH}`
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: GITHUB_OAUTH_SCOPE,
        state,
        // `login` intent is a first-class login; `link` re-authorizes to attach the account.
        allow_signup: intent === "login" ? "true" : "false",
    })
    window.location.assign(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`)
}

/**
 * Validates the `state` GitHub echoed back against the persisted one and returns the
 * original intent, clearing the pending record either way (single-use).
 *
 * @param returnedState - the `?state` value from the callback URL.
 * @returns the original {@link GithubAuthIntent}, or `null` when state is missing/mismatched
 *          (treat as a CSRF failure and abort the exchange).
 */
export const consumeGithubOAuthIntent = (
    returnedState: string | null,
): GithubAuthIntent | null => {
    if (typeof window === "undefined") {
        return null
    }
    const raw = window.sessionStorage.getItem(PENDING_STORAGE_KEY)
    window.sessionStorage.removeItem(PENDING_STORAGE_KEY)
    if (!raw || !returnedState) {
        return null
    }
    try {
        const pending = JSON.parse(raw) as GithubOAuthPending
        if (pending.state && pending.state === returnedState) {
            return pending.intent
        }
    } catch {
        // fall through — corrupt record is treated as a failed/forged round trip
    }
    return null
}
