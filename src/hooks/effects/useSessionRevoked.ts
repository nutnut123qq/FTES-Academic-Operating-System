"use client"

import { useEffect } from "react"
import { useSWRConfig } from "swr"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { onSessionRevoked, resetSessionRevokedGuard } from "@/modules/api/rest/client"
import { useAppDispatch } from "@/redux/hooks"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { pathConfig } from "@/resources/path"

/**
 * Ends the client session the moment the backend reports the session behind the
 * stored credentials as revoked (`IDENTITY_SESSION_REVOKED`) — the learner signed
 * this device out from another one, an administrator locked the account, or
 * refresh-token reuse killed the token family.
 *
 * The REST client already wiped both tokens synchronously (it must, or the next call
 * would resend a dead bearer) and announced the fact; this hook owns the part that
 * needs the React tree:
 *  - reset the Redux auth state (`accessToken` / `authenticated` / `user`),
 *  - flush the ENTIRE SWR cache through the provider's own `mutate` — the app uses a
 *    custom cache provider, so the module-level `mutate` from `swr` would miss it —
 *    otherwise the next user in this tab reads the revoked user's `/me/*` data,
 *  - send the learner home and open the sign-in modal (there is no standalone
 *    sign-in route; authentication is a modal).
 *
 * Mounted once in `UseEffects`.
 */
export const useSessionRevoked = () => {
    const dispatch = useAppDispatch()
    const router = useRouter()
    const locale = useLocale()
    const { mutate } = useSWRConfig()
    const { open } = useAuthenticationOverlayState()

    useEffect(() => {
        const unsubscribe = onSessionRevoked(() => {
            dispatch(setAccessToken(undefined))
            dispatch(setAuthenticated(false))
            dispatch(setUser(null))
            // match-all filter, no revalidate: every cached key drops to `undefined`
            // so nothing of the dead session survives into the next sign-in
            void mutate(() => true, undefined, { revalidate: false })
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
            router.replace(pathConfig().locale(locale).build())
            open("auth.context.sessionRevoked")
            // re-arm so a session revoked LATER in this same tab is handled again
            resetSessionRevokedGuard()
        })
        return unsubscribe
    }, [dispatch, locale, mutate, open, router])
}
