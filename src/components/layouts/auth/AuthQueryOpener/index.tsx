"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/** Recognised `?auth=` values → modal tab. Unknown values are ignored entirely. */
const AUTH_PARAM_TAB_MAP: Record<string, AuthenticationModalTab> = {
    signin: AuthenticationModalTab.SignIn,
    signup: AuthenticationModalTab.SignUp,
}

/**
 * Deep-link opener for the authentication modal — mounted ONCE (inside a Suspense
 * boundary, it renders `null`) in `InnerLayout`.
 *
 * When the URL carries `?auth=signin|signup` (e.g. a shared `/vi?auth=signup` link or
 * the `/authentication/register` redirect), it opens `AuthenticationModal` on the
 * matching tab for GUESTS, then strips the param via `router.replace` (no new history
 * entry, so Back never re-opens it). Signed-in visitors (live redux flag OR a stored
 * access token, which covers the pre-hydration race) get the param stripped silently.
 * Unknown `auth` values are ignored.
 */
export const AuthQueryOpener = () => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { open } = useAuthenticationOverlayState()
    // guard against re-running while router.replace propagates (StrictMode double-effect safe)
    const handledRef = useRef(false)

    useEffect(() => {
        const authParam = searchParams.get("auth")
        if (!authParam) {
            handledRef.current = false
            return
        }
        const tab = AUTH_PARAM_TAB_MAP[authParam]
        if (!tab || handledRef.current) {
            return
        }
        handledRef.current = true
        const signedIn =
            authenticated ||
            Boolean(LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken))
        if (!signedIn) {
            dispatch(setAuthenticationModalTab(tab))
            open()
        }
        // strip the param without adding a history entry (keep any other params)
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete("auth")
        const query = nextParams.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }, [searchParams, pathname, router, dispatch, open, authenticated])

    return null
}
