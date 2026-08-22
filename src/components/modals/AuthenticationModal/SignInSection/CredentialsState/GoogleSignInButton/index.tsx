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
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useLocale } from "next-intl"
import { useTheme } from "next-themes"
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
    const { resolvedTheme } = useTheme()
    const clientId = publicEnv().google.clientId
    const wrapperRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const runRest = useRestWithToast()
    const { trigger } = usePostLoginWithGoogleSwr()

    // GIS renderButton needs a fixed px width. A hard-coded 320 overflowed the xs auth modal
    // (horizontal scrollbar / cut-off button), so measure the available width and clamp to
    // GIS's supported range [200, 400]. Re-measures on resize (mobile bottom-sheet ↔ desktop).
    const [width, setWidth] = useState(0)
    useEffect(() => {
        const el = wrapperRef.current
        if (!el) {
            return
        }
        const measure = () => {
            const w = el.clientWidth
            if (w > 0) {
                setWidth(Math.min(400, Math.max(200, Math.floor(w))))
            }
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

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
        if (!clientId || !width) {
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
                    // Match the app theme: GIS "outline" is a white/light button (wrong on the
                    // dark modal); "filled_black" is the dark-mode variant.
                    theme: resolvedTheme === "dark" ? "filled_black" : "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "pill",
                    logo_alignment: "left",
                    width,
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
    }, [clientId, locale, handleCredential, width, resolvedTheme])

    if (!clientId) {
        return null
    }

    return (
        <div className={`w-full max-w-full overflow-hidden ${className ?? ""}`}>
            <div
                ref={wrapperRef}
                className="flex justify-center"
            >
                <div ref={containerRef} />
            </div>
        </div>
    )
}
