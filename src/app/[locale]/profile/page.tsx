"use client"

import React, {
    useEffect,
} from "react"
import {
    useLocale,
} from "next-intl"
import {
    useRouter,
    useSearchParams,
} from "next/navigation"
import {
    PublicProfile,
} from "@/components/features/profile/PublicProfile"
import { useAppSelector } from "@/redux/hooks"
import { pathConfig } from "@/resources/path"

/**
 * Route `/[locale]/profile` — the signed-in user's own profile. Canonicalizes the
 * URL to `/[locale]/profile/<username>` (GitHub-style) once the viewer is known,
 * preserving the query (e.g. `?tab=overview`), so the bare route never lingers in
 * the address bar. {@link PublicProfile} renders immediately meanwhile (it resolves
 * the viewer's username on the bare route), so the redirect causes no blank flash.
 * Settings live under `/profile/*` sub-pages reached from the account menu.
 */
const Page = () => {
    const router = useRouter()
    const locale = useLocale()
    const searchParams = useSearchParams()
    const username = useAppSelector((state) => state.user.user?.username)

    useEffect(() => {
        if (!username) {
            return
        }
        const query = searchParams.toString()
        const target = pathConfig().locale(locale).profile(username).build()
        router.replace(query ? `${target}?${query}` : target)
    }, [username, locale, searchParams, router])

    return <PublicProfile />
}

export default Page
