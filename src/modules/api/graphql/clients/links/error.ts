import { CombinedGraphQLErrors, CombinedProtocolErrors } from "@apollo/client"
import { ErrorLink } from "@apollo/client/link/error"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/** Substring of the backend message raised when a newer login evicts this session. */
const SESSION_SUPERSEDED_MARKER = "superseded"

/**
 * Handles the single-session eviction: when a newer login on another device
 * supersedes this session, the backend rejects authenticated requests. We drop
 * the stale access token and send the user back to the home page (which renders
 * the logged-out state), so they aren't stuck on a half-broken authed view.
 */
const handleSessionSuperseded = (): void => {
    // only act in the browser — the error link can also run during SSR
    if (typeof window === "undefined") return
    // remove the now-invalid access token so the app treats us as logged out
    LocalStorage.removeItem(LocalStorageId.KeycloakAccessToken)
    // flag in sessionStorage so we can show a toast after hard reload
    try {
        sessionStorage.setItem("superseded_toast", "true")
    } catch (e) {
        // ignore storage quota/security restrictions
    }
    // hard navigate home to reset all in-memory auth state (redux, apollo cache)
    window.location.href = "/"
}

/**
 * Centralized logging for GraphQL, protocol, and network errors, plus
 * single-session eviction handling.
 *
 * @see {@link https://www.apollographql.com/docs/react/api/link/apollo-link-error | ErrorLink API}
 */
export const createErrorLink = (debug = false) =>
    new ErrorLink(({ error }) => {
        if (CombinedGraphQLErrors.is(error)) {
            for (const gqlErr of error.errors) {
                // a newer login elsewhere evicted this session → force logout
                if (gqlErr.message?.includes(SESSION_SUPERSEDED_MARKER)) {
                    handleSessionSuperseded()
                    return
                }
                if (
                    gqlErr.message === "Unauthorized"
                    || gqlErr.extensions?.code === "UNAUTHENTICATED"
                ) {
                    if (debug) {
                        console.log("[GraphQL error]: Unauthorized")
                    }
                }
            }
            return
        }
        if (CombinedProtocolErrors.is(error)) {
            error.errors.forEach(({ message, extensions }) => {
                if (debug) {
                    console.log(
                        `[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(
                            extensions
                        )}`
                    )
                }
            }
            )
            return
        }
        console.error(`[Network error]: ${error.message}`)
    }
    )
