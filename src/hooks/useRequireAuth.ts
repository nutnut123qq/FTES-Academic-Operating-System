"use client"

import { useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"

/**
 * Shared auth guard for guest-gated interactions (like, comment, save/bookmark,
 * enroll, any auth-required CTA) — the SINGLE entry point that consolidates all
 * "must be signed in" handling into the `AuthenticationModal` popup.
 *
 * Signed-in → the action runs. Guest → the modal opens on the SignIn tab with a
 * contextual message (an i18n key stashed in the overlay store, e.g.
 * `auth.context.enroll`) and the action does NOT run; the visitor stays on the
 * current route. The context message is cleared when the modal closes.
 *
 * @returns `authenticated` (the session flag), `requireAuth(contextKey?)` (boolean
 * check that opens the modal for guests) and `guard(action, contextKey?)` (wraps a
 * callback so it only fires when signed in).
 */
export const useRequireAuth = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
    const { open } = useAuthenticationOverlayState()

    /**
     * Check the session before an auth-required interaction.
     * @param contextKey - i18n key of the contextual message shown in the modal
     * (defaults to the generic "sign in to continue" message).
     * @returns `true` when signed in (caller proceeds); `false` for guests (the
     * modal was opened on SignIn with the context message, caller must abort).
     */
    const requireAuth = useCallback(
        (contextKey?: string): boolean => {
            if (authenticated) {
                return true
            }
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
            open(contextKey ?? "auth.context.generic")
            return false
        },
        [authenticated, dispatch, open],
    )

    /**
     * Wrap an action so it only runs when signed in; guests get the modal instead.
     * @param action - the auth-required callback to protect.
     * @param contextKey - i18n key of the contextual message shown in the modal.
     * @returns a callback with the same arguments that no-ops (opens the modal) for guests.
     */
    const guard = useCallback(
        <Args extends Array<unknown>>(action: (...args: Args) => void, contextKey?: string) =>
            (...args: Args) => {
                if (requireAuth(contextKey)) {
                    action(...args)
                }
            },
        [requireAuth],
    )

    return { authenticated, requireAuth, guard }
}
