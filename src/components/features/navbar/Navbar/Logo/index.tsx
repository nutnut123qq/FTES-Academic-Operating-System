"use client"

import React, {
    useCallback,
} from "react"
import {
    cn,
    Link,
} from "@heroui/react"
import {
    pathConfig,
} from "@/resources/path"
import {
    useRouter,
} from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"
import { BrandLogo } from "@/components/blocks/identity/BrandLogo"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link Logo}.
 */
export type LogoProps = WithClassNames<undefined>

/**
 * Logo — the {@link BrandLogo} lockup wrapped in a link whose target depends on the
 * SESSION: a signed-in visitor goes to `/dashboard` (their workspace home), a guest goes
 * to the ungated `/home` landing — still reachable while signed in, it is simply not
 * where the logo sends someone who already has a workspace.
 *
 * `"use client"` for the router press handler and the session flags.
 * @param props - optional container class name
 */
export const Logo = ({ className }: LogoProps) => {
    const router = useRouter()
    // The same pair `HomeLanding` reads: `authenticated` alone is false for EVERYONE
    // until the session settles, so it only means "guest" once `initialized` is true.
    const initialized = useAppSelector((state) => state.keycloak.initialized)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const signedIn = initialized && authenticated

    /**
     * Signed in → the workspace; guest OR a session that has not settled yet → `/home`.
     *
     * The undecided window leans towards `/home` on purpose, and that is only safe
     * because `/home` no longer bounces anyone: guessing wrong that way shows a signed-in
     * visitor the landing, a page they can read and navigate out of. Guessing wrong the
     * other way would drop a guest onto an empty dashboard.
     */
    const onPress = useCallback(
        () => router.push(
            signedIn
                ? pathConfig().locale().dashboard().build()
                : pathConfig().locale().home().build(),
        ),
        [
            router,
            signedIn,
        ],
    )
    return (
        <Link
            onPress={onPress}
            className={cn("cursor-pointer", className)}
        >
            <BrandLogo />
        </Link>
    )
}
