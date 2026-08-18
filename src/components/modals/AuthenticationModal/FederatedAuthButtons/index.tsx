"use client"

/**
 * The federated sign-in cluster shown at the top of BOTH auth tabs (sign-in and sign-up):
 * the GIS Google button, the GitHub redirect button, and an "OR" divider above the
 * credential form. One implementation so the two tabs never drift.
 *
 * Signing up and signing in with a provider are the SAME backend call (the BE creates the
 * account on first use), so this block is identical on both tabs — only the caller's
 * `onGoogleSuccess` differs (each tab passes its own "what to do after a Google login").
 * GitHub navigates away (redirect), so it needs no success callback here.
 *
 * The divider only renders when at least one provider is configured — when both client ids
 * are unset both buttons hide themselves and a lone "OR" line would be dangling.
 */
import React from "react"
import { Separator } from "@heroui/react"
import { useTranslations } from "next-intl"
import { publicEnv } from "@/resources/env/public"
import { GoogleSignInButton } from "../SignInSection/CredentialsState/GoogleSignInButton"
import { GithubSignInButton } from "../SignInSection/CredentialsState/GithubSignInButton"

/** Props for {@link FederatedAuthButtons}. */
export interface FederatedAuthButtonsProps {
    /** Called after a Google login yields a token (the tab decides: run the set-password gate). */
    onGoogleSuccess: () => void
}

/**
 * Google + GitHub shortcuts and the "OR" divider, shared by both auth tabs.
 * @param props - {@link FederatedAuthButtonsProps}
 */
export const FederatedAuthButtons = ({ onGoogleSuccess }: FederatedAuthButtonsProps) => {
    const t = useTranslations()
    const { google, github } = publicEnv()
    const hasAnyProvider = Boolean(google.clientId || github.clientId)

    return (
        <>
            <GoogleSignInButton onSuccess={onGoogleSuccess} />
            {github.clientId ? <div className="h-2" /> : null}
            <GithubSignInButton />

            {hasAnyProvider ? (
                <>
                    <div className="h-3" />
                    <div className="flex items-center justify-center gap-2">
                        <Separator className="flex-1" />
                        <div className="text-xs text-muted">{t("auth.oauth.or")}</div>
                        <Separator className="flex-1" />
                    </div>
                </>
            ) : null}
        </>
    )
}
