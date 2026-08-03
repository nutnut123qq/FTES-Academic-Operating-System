/**
 * Minimal typings + a one-shot script loader for **Google Identity Services** (GIS,
 * `https://accounts.google.com/gsi/client`).
 *
 * We use GIS only to obtain a Google **ID token** (the `credential` handed to the
 * button/One-Tap callback), which the backend verifies at `POST /api/v1/auth/google`.
 * We deliberately do NOT use the OAuth2 access-token flow (`initTokenClient`) — that
 * returns a Google access token, not the ID token the backend expects.
 */

/** Payload delivered to the GIS callback after a successful sign-in. */
export interface GoogleCredentialResponse {
    /** A Google-signed JWT ID token (`aud` = the configured client id). */
    credential: string
    /** How the credential was selected (e.g. "btn", "auto"). */
    select_by?: string
}

/** Config for `google.accounts.id.initialize`. */
export interface GoogleIdConfiguration {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: "popup" | "redirect"
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    use_fedcm_for_prompt?: boolean
}

/** Config for `google.accounts.id.renderButton`. */
export interface GoogleButtonConfiguration {
    type?: "standard" | "icon"
    theme?: "outline" | "filled_blue" | "filled_black"
    size?: "large" | "medium" | "small"
    text?: "signin_with" | "signup_with" | "continue_with" | "signin"
    shape?: "rectangular" | "pill" | "circle" | "square"
    logo_alignment?: "left" | "center"
    width?: number | string
    locale?: string
}

/** The `google.accounts.id` surface we use. */
export interface GoogleAccountsId {
    initialize: (config: GoogleIdConfiguration) => void
    renderButton: (parent: HTMLElement, config: GoogleButtonConfiguration) => void
    prompt: () => void
    cancel: () => void
    disableAutoSelect: () => void
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: GoogleAccountsId
            }
        }
    }
}

const GIS_SRC = "https://accounts.google.com/gsi/client"

/** Shared in-flight load so concurrent callers await ONE script insertion. */
let gisLoadPromise: Promise<GoogleAccountsId> | null = null

/**
 * Loads Google Identity Services once and resolves with the `google.accounts.id` API.
 * Rejects on SSR or if the script fails to load. Safe to call repeatedly — subsequent
 * calls return the same promise (or resolve immediately once loaded).
 */
export const loadGoogleIdentityServices = (): Promise<GoogleAccountsId> => {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Google Identity Services unavailable during SSR"))
    }
    if (window.google?.accounts?.id) {
        return Promise.resolve(window.google.accounts.id)
    }
    if (gisLoadPromise) {
        return gisLoadPromise
    }

    gisLoadPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
        const onReady = () => {
            if (window.google?.accounts?.id) {
                resolve(window.google.accounts.id)
            } else {
                gisLoadPromise = null
                reject(new Error("Google Identity Services loaded but window.google.accounts.id is missing"))
            }
        }
        const onFail = () => {
            gisLoadPromise = null
            reject(new Error("Failed to load Google Identity Services script"))
        }

        const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
        if (existing) {
            if (window.google?.accounts?.id) {
                onReady()
                return
            }
            existing.addEventListener("load", onReady, { once: true })
            existing.addEventListener("error", onFail, { once: true })
            return
        }

        const script = document.createElement("script")
        script.src = GIS_SRC
        script.async = true
        script.defer = true
        script.addEventListener("load", onReady, { once: true })
        script.addEventListener("error", onFail, { once: true })
        document.head.appendChild(script)
    })

    return gisLoadPromise
}
