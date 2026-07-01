import { ApolloLink } from "@apollo/client"

/** Name of the (non-HttpOnly) cookie the backend sets with the CSRF token. */
const CSRF_COOKIE_NAME = "csrf_token"

/** Request header the backend's CsrfGuard reads for the double-submit check. */
const CSRF_HEADER_NAME = "x-csrf-token"

/**
 * Reads the `csrf_token` cookie value from `document.cookie`.
 *
 * The backend issues this cookie (readable by JS, not HttpOnly) on login and
 * on every token refresh. It must be echoed back in the `x-csrf-token` header
 * on cookie-driven mutations (`refreshToken`, `signOut`) so the signed
 * double-submit check passes.
 *
 * @returns The decoded token, or `undefined` when absent / on the server.
 */
const readCsrfToken = (): string | undefined => {
    // guard SSR / non-browser execution where `document` is unavailable
    if (typeof document === "undefined") return undefined
    // match `csrf_token=<value>` at start or after a "; " separator
    const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`)
    )
    // decode the captured value (cookies are URL-encoded), else undefined
    return match?.[1] ? decodeURIComponent(match[1]) : undefined
}

/**
 * Apollo link that attaches the `x-csrf-token` header from the `csrf_token`
 * cookie. Harmless on requests that don't need it (header simply ignored).
 *
 * @param debug - When `true`, logs whether a token was attached.
 * @returns An {@link ApolloLink} that injects the CSRF header.
 */
export const createAttachCsrfTokenLink = (debug = false) =>
    new ApolloLink((operation, forward) => {
        // read the current CSRF token from the cookie on every request
        const token = readCsrfToken()
        // only set the header when we actually have a token to send
        if (token) {
            operation.setContext(({ headers = {} }) => ({
                headers: {
                    ...headers,
                    [CSRF_HEADER_NAME]: token,
                },
            }))
        }
        if (debug) {
            console.log(
                `[AttachCsrfTokenLink] op=${operation.operationName} csrf=${token ? "(present)" : "(none)"}`
            )
        }
        return forward(operation)
    }
    )
