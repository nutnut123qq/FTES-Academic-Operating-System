"use client"

import React, { useCallback, useEffect } from "react"
import { cn, Spinner } from "@heroui/react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { pathConfig } from "@/resources/path"
import type { WithClassNames } from "@/modules/types/base/class-name"

import { OauthAction } from "./enums"
import { OAUTH_ACTION_MESSAGE_KEY_MAP } from "./map"
import { LogoMark } from "@/components/svg"
import { Spacer } from "@/components/reuseable/Spacer"
import { SessionStorage } from "@/modules/storage/session/storage"
import { SessionStorageId } from "@/modules/storage/session/enums/id"
import { sleep } from "@/modules/utils/misc"

export * from "./enums"

/** Props for {@link OauthRedirect}. */
export interface OauthRedirectProps extends WithClassNames<undefined> {
    /**
     * The OAuth lifecycle step this redirect page represents — selects the i18n
     * message shown under the spinner. Sign-in steps (`Login`/`Authenticate`)
     * return the user to the route they started the OAuth flow from
     * (`SessionStorageId.AuthReturnTo`, stashed by the modal's OAuth buttons);
     * `Logout` — and any landing with no remembered route — falls back to the
     * locale home.
     */
    action: OauthAction
}

/**
 * OAuth redirect landing — shown after a Keycloak provider hand-off
 * (login / logout / generic authenticate). Branded transitional state (logo mark
 * over a spinner, never a bare page); waits ~1s so the session settles, then
 * `router.replace`s BACK to the origin route (spec `auth-popup-entry`: OAuth
 * round-trip returns to origin) or the locale home. Not a navigation destination.
 *
 * `"use client"`: relies on `useRouter`, `useEffect` and `useLocale`.
 */
export const OauthRedirect = ({ action, className }: OauthRedirectProps) => {
    const router = useRouter()
    const locale = useLocale()
    const t = useTranslations()

    // Hold the user briefly so the Keycloak session settles, then return to origin.
    const onRedirect = useCallback(() => {
        sleep(1000).then(
            () => {
                const home = pathConfig().locale(locale).build()
                const isSignIn =
                    action === OauthAction.Login || action === OauthAction.Authenticate
                const returnTo = isSignIn
                    ? SessionStorage.getItem<string>(SessionStorageId.AuthReturnTo)
                    : undefined
                SessionStorage.removeItem(SessionStorageId.AuthReturnTo)
                // replace, not push — the transitional landing must not stay in history
                router.replace(returnTo || home)
            }
        )
    }, [action, locale, router])

    useEffect(() => {
        onRedirect()
    }, [onRedirect])

    return (
        <div className={cn("flex min-h-[60vh] flex-col items-center justify-center", className)}>
            <div
                className="flex flex-col items-center gap-3"
            >
                <LogoMark className="size-10" />
                <Spinner
                    color="accent"
                    size="lg"
                />
                <Spacer y={3} />
                <div
                    className="text-sm text-muted"
                    role="status"
                >
                    {t(OAUTH_ACTION_MESSAGE_KEY_MAP[action])}
                </div>
            </div>
        </div>
    )
}
