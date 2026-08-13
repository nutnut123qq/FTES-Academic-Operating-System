import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type { RestError } from "./client"

/**
 * Backend error code (HTTP 401) meaning "the session behind this token has been
 * revoked" — the device was signed out from another device, the account was locked,
 * or refresh-token reuse killed the token family. Distinct from a plain 401 (expired
 * token) precisely so the client can tell "refresh me" apart from "you are out".
 *
 * Mirrors `IDENTITY_SESSION_REVOKED` from the backend change
 * `identity-session-liveness-email-2fa`.
 */
export const SESSION_REVOKED_ERROR_CODE = "IDENTITY_SESSION_REVOKED"

/**
 * Whether an error is the backend's revoked-session rejection.
 *
 * @param error - The error thrown by a REST call (usually a {@link RestError}).
 * @returns `true` when the backend reported the session as revoked.
 */
export const isSessionRevokedError = (error: unknown): boolean =>
    (error as RestError | null)?.errorCode === SESSION_REVOKED_ERROR_CODE

/** Listeners notified once per revocation (registered by the app-level effect hook). */
const listeners = new Set<() => void>()

/**
 * Subscribes to revoked-session events.
 *
 * The React side of the teardown (Redux reset, SWR cache flush, sending the learner
 * back to sign-in) cannot run from this module — the SWR cache lives behind a custom
 * provider and Redux/overlay state belongs to the tree — so the transport layer only
 * announces the fact and one mounted hook performs it.
 *
 * @param listener - Called when a request fails with {@link SESSION_REVOKED_ERROR_CODE}.
 * @returns An unsubscribe function.
 */
export const onSessionRevoked = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

/**
 * True between the first revoked response and the moment the app has finished
 * reacting. A revoked session usually fails EVERY in-flight request at once, so
 * without this the teardown would fire a dozen times (a dozen toasts, a dozen
 * redirects). Reset by {@link resetSessionRevokedGuard} once the app has handled it.
 */
let isHandling = false

/**
 * Clears the stored credentials immediately and announces the revocation once.
 *
 * The token wipe is synchronous and happens here rather than in the subscriber:
 * every subsequent request must stop sending a bearer that the backend has already
 * rejected — including the refresh token, since refreshing a revoked session only
 * fails again (and can trip reuse-detection).
 */
export const handleSessionRevoked = (): void => {
    if (typeof window === "undefined" || isHandling) {
        return
    }
    isHandling = true
    LocalStorage.removeItem(LocalStorageId.KeycloakAccessToken)
    LocalStorage.removeItem(LocalStorageId.KeycloakRefreshToken)
    listeners.forEach((listener) => {
        listener()
    })
}

/**
 * Re-arms {@link handleSessionRevoked} after the app has finished its teardown, so a
 * later session can be revoked again in the same tab (sign in → revoked → sign in).
 */
export const resetSessionRevokedGuard = (): void => {
    isHandling = false
}
