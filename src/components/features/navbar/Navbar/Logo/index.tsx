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
import { BrandLogo } from "@/components/blocks/identity/BrandLogo"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link Logo}.
 */
export type LogoProps = WithClassNames<undefined>

/**
 * Logo — the {@link BrandLogo} lockup wrapped in a link that routes home when
 * pressed.
 *
 * ONE target for everyone: `/home`. It briefly depended on the session (signed in →
 * `/dashboard`) while the landing bounced signed-in visitors; the product owner removed
 * that redirect on 2026-08-21, so the logo has no reason to branch — `/home` is reachable
 * by anyone and nobody gets bounced out of it. See the {@link
 * import("@/components/features/home-landing/HomeLanding").HomeLanding} docblock.
 *
 * `"use client"` for the router press handler.
 * @param props - optional container class name
 */
export const Logo = ({ className }: LogoProps) => {
    const router = useRouter()

    /** Navigate to the landing route — reachable by everyone, signed in or not. */
    const onPress = useCallback(
        () => router.push(pathConfig().locale().home().build()),
        [
            router,
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
