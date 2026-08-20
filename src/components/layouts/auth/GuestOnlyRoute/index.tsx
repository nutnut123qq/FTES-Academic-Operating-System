"use client"

import React, { useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link GuestOnlyRoute}. */
export interface GuestOnlyRouteProps {
    /** Page content that only makes sense for a visitor WITHOUT a session. */
    children: React.ReactNode
}

/**
 * Wrapper for a route whose whole reason to exist disappears once a session is
 * live — today only `/authentication/forgot-password`. Signing in never navigates
 * anywhere (`AuthenticationModal` merely closes), so a guest-only page has to push
 * itself off screen: someone who requested a reset link, then signed in with
 * another account in the same tab, otherwise keeps staring at "check your inbox"
 * under a signed-in header.
 *
 * **Only ever acts on `authenticated === true`.** `state.keycloak.authenticated`
 * is not persisted: it is `false` on EVERY page load until the user fetcher
 * resolves, so `false` means "not known yet", not "guest". Reading a single
 * direction makes the hydration window cost a late redirect instead of throwing
 * real guests off the page — which is why this deliberately does not consult
 * `auth-ready`. Do not "improve" it into a two-way guard.
 *
 * Deliberately NOT applied to the rest of `authentication/**`: `two-factor`
 * REQUIRES a session (it enrolls TOTP with the access token), `verify-otp` runs
 * both as `purpose=LOGIN` (guest) and `purpose=VERIFY_PHONE` (signed in),
 * `reset-password` is authorised by the emailed `?token` rather than by a session
 * (bouncing it would strand anyone who opens the mail in their signed-in browser),
 * the OAuth callback/logout routes need the session, and `register` already
 * redirects server-side.
 *
 * @param props - {@link GuestOnlyRouteProps}
 */
export const GuestOnlyRoute = ({ children }: GuestOnlyRouteProps) => {
    const router = useRouter()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    useEffect(() => {
        if (authenticated) {
            // replace, not push: Back must not return to a page we just rejected
            router.replace("/")
        }
    }, [authenticated, router])

    // Hide the content for the frame(s) the navigation takes, otherwise the stale
    // card flashes under an already signed-in header — the exact reported symptom.
    if (authenticated) {
        return null
    }

    return <>{children}</>
}
