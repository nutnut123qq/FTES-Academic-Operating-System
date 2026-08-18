"use client"

import React, { useEffect, useRef, useState } from "react"
import { Spinner, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { WarningCircleIcon } from "@phosphor-icons/react"
import { Link, useRouter } from "@/i18n/navigation"
import { useRestWithToast } from "@/modules/toast/hooks"
import { consumeGithubOAuthIntent } from "@/modules/githubIdentity"
import { usePostLoginWithGithubSwr } from "@/hooks/swr/api/rest/mutations/usePostLoginWithGithubSwr"
import { usePostLinkGithubSwr } from "@/hooks/swr/api/rest/mutations/usePostLinkGithubSwr"
import { useFederatedLoginComplete } from "@/hooks/auth"

/** Locale-less landing after a GitHub LOGIN (used with `@/i18n/navigation`). */
const HOME_PATH = "/"
/** Locale-less settings page to return to after LINKING GitHub. */
const SETTINGS_SECURITY_PATH = "/profile/settings/security"

/**
 * GithubCallback — the `/authentication/github/callback` handler.
 *
 * Reads `?code&state` (and any `?error`), validates the CSRF `state` against the pending
 * flow persisted before the redirect, then branches on the stored INTENT:
 * - `login` → `POST /auth/github {code}` (stores tokens like Google) → run the shared
 *   forced-set-password gate → home.
 * - `link` → `POST /identity/linked-accounts/github {code}` → toast → back to settings.
 *
 * Any failure (GitHub `?error`, missing/forged state, rejected exchange) drops into a
 * graceful error panel with a link back, rather than a blank/looping screen.
 */
export const GithubCallback = () => {
    const t = useTranslations()
    const searchParams = useSearchParams()
    const router = useRouter()
    const runRest = useRestWithToast()
    const { trigger: triggerLogin } = usePostLoginWithGithubSwr()
    const { trigger: triggerLink } = usePostLinkGithubSwr()
    const completeFederatedLogin = useFederatedLoginComplete()

    // "processing" while the exchange runs; "error" shows the recoverable panel.
    const [status, setStatus] = useState<"processing" | "error">("processing")
    // The exchange must run exactly once — a re-render (or StrictMode double-mount) must not
    // re-post a single-use `code`.
    const ranRef = useRef(false)

    useEffect(() => {
        if (ranRef.current) {
            return
        }
        ranRef.current = true

        const providerError = searchParams.get("error")
        const code = searchParams.get("code")
        const returnedState = searchParams.get("state")

        if (providerError || !code) {
            setStatus("error")
            return
        }

        const intent = consumeGithubOAuthIntent(returnedState)
        if (!intent) {
            // Missing / mismatched state → treat as a forged or expired round trip.
            setStatus("error")
            return
        }

        void (async () => {
            if (intent === "link") {
                await runRest(
                    () => triggerLink({ code }),
                    { successMessage: t("auth.github.linkedToast") },
                )
                // Return to settings whether it linked or the toast already explained a failure.
                router.replace(SETTINGS_SECURITY_PATH)
                return
            }

            // intent === "login"
            const result = await runRest(
                () => triggerLogin({ code }),
                { successMessage: t("auth.github.signedInToast") },
            )
            if (result === null || !result.accessToken) {
                setStatus("error")
                return
            }
            // Forced-set-password gate carries the home target forward so the user only lands
            // home AFTER creating a password (when the account has none).
            await completeFederatedLogin({ redirectTo: HOME_PATH })
        })()
    }, [
        searchParams,
        router,
        runRest,
        triggerLogin,
        triggerLink,
        completeFederatedLogin,
        t,
    ])

    if (status === "error") {
        return (
            <div
                className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-separator p-6 text-center"
                role="alert"
            >
                <WarningCircleIcon className="size-10 text-danger" weight="fill" aria-hidden />
                <Typography type="body-sm" weight="medium">
                    {t("auth.github.errorTitle")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("auth.github.errorBody")}
                </Typography>
                <Link href={HOME_PATH} className="text-accent no-underline hover:underline">
                    <Typography type="body-sm" className="text-accent">
                        {t("auth.github.backHome")}
                    </Typography>
                </Link>
            </div>
        )
    }

    return (
        <div
            className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-separator p-6 text-center"
            role="status"
        >
            <Spinner size="md" />
            <Typography type="body-sm" weight="medium">
                {t("auth.github.connecting")}
            </Typography>
        </div>
    )
}
