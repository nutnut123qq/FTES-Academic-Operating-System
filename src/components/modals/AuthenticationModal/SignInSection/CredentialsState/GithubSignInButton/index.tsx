"use client"

/**
 * "Continue with GitHub" button — starts the GitHub OAuth REDIRECT flow.
 *
 * Unlike Google (in-page GIS token), GitHub has no browser SDK: pressing this sends the
 * browser to `github.com/login/oauth/authorize` with a random `state` + the login intent
 * persisted (see `@/modules/githubIdentity`). GitHub redirects back to
 * `/authentication/github/callback`, where the `?code` is exchanged at `POST /auth/github`.
 * Because it navigates away, there is no `onSuccess` here — the callback route drives the
 * forced-set-password gate on return.
 *
 * Renders nothing when `NEXT_PUBLIC_GITHUB_CLIENT_ID` is unset (same rule as Google).
 */
import React, { useCallback } from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { publicEnv } from "@/resources/env/public"
import { beginGithubOAuth } from "@/modules/githubIdentity"
import { GithubIcon } from "@/components/svg/GithubIcon"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link GithubSignInButton}. */
export type GithubSignInButtonProps = WithClassNames<undefined>

/**
 * GitHub sign-in button (redirect flow). Same visual weight as the GIS Google button.
 */
export const GithubSignInButton = ({ className }: GithubSignInButtonProps) => {
    const t = useTranslations()
    const clientId = publicEnv().github.clientId

    const onPress = useCallback(() => {
        beginGithubOAuth(clientId, "login")
    }, [clientId])

    if (!clientId) {
        return null
    }

    return (
        <div className={className}>
            <div className="flex justify-center">
                <Button
                    type="button"
                    variant="outline"
                    className="w-80 max-w-full rounded-full text-sm"
                    onPress={onPress}
                >
                    <span className="inline-flex items-center justify-center gap-2">
                        <GithubIcon className="size-5" />
                        {t("auth.oauth.continueGithub")}
                    </span>
                </Button>
            </div>
        </div>
    )
}
