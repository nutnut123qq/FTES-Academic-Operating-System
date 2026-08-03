"use client"

/**
 * "Sign in with Google" button backed by Google Identity Services (GIS).
 *
 * Flow: GIS renders its own branded button → on click the user picks a Google account →
 * GIS hands us a Google **ID token** (`credential`) → we POST it to `/api/v1/auth/google`
 * via {@link usePostLoginWithGoogleSwr} (which persists the returned access + refresh
 * tokens) → on success we close the auth modal. This replaces the legacy Keycloak PKCE +
 * GraphQL `exchangeCodeForToken` path, whose Keycloak tokens the Java backend does not
 * accept.
 *
 * Renders nothing when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is unset.
 */
import React, { useCallback, useEffect, useRef } from "react"
import { useLocale } from "next-intl"
import { publicEnv } from "@/resources/env/public"
import { loadGoogleIdentityServices } from "@/modules/googleIdentity"
import { usePostLoginWithGoogleSwr } from "@/hooks/swr/api/rest/mutations/usePostLoginWithGoogleSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link GoogleSignInButton}. */
export interface GoogleSignInButtonProps extends WithClassNames<undefined> {
    /** Called after a Google sign-in that yields an access token (e.g. close the modal). */
    onSuccess?: () => void
}

/**
 * Google sign-in button (GIS). Obtains a Google ID token and exchanges it for FTES tokens.
 */
export const GoogleSignInButton = ({
    onSuccess,
    className,
}: GoogleSignInButtonProps) => {
    const locale = useLocale()
    const clientId = publicEnv().google.clientId
    const containerRef = useRef<HTMLDivElement>(null)
    const runRest = useRestWithToast()
    const { trigger } = usePostLoginWithGoogleSwr()

    // Keep the latest success handler without re-running the GIS init effect on each render.
    const onSuccessRef = useRef(onSuccess)
    onSuccessRef.current = onSuccess

    const handleCredential = useCallback(
        async (idToken: string) => {
            const result = await runRest(
                () => trigger({ idToken }),
                { showErrorToast: true, showSuccessToast: true },
            )
            if (result?.accessToken) {
                onSuccessRef.current?.()
            }
        },
        [runRest, trigger],
    )

    useEffect(() => {
        if (!clientId) {
            return
        }
        let cancelled = false
        loadGoogleIdentityServices()
            .then((googleId) => {
                if (cancelled || !containerRef.current) {
                    return
                }
                googleId.initialize({
                    client_id: clientId,
                    callback: (response) => {
                        if (response?.credential) {
                            void handleCredential(response.credential)
                        }
                    },
                    ux_mode: "popup",
                    auto_select: false,
                    cancel_on_tap_outside: true,
                })
                // clear before render so a StrictMode double-invoke can't stack two buttons
                containerRef.current.innerHTML = ""
                googleId.renderButton(containerRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "pill",
                    logo_alignment: "left",
                    width: 320,
                    locale,
                })
            })
            .catch(() => {
                // Script blocked / offline → the button simply won't appear; password
                // login remains available. A failed exchange later surfaces via the toast.
            })
        return () => {
            cancelled = true
        }
    }, [clientId, locale, handleCredential])

    if (!clientId) {
        return null
    }

    return (
        <div className={className}>
            <div
                ref={containerRef}
                className="flex justify-center"
            />
        </div>
    )
}
