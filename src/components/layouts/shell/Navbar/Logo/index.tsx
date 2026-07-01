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
import { LogoMark } from "@/components/svg/LogoMark"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link Logo}.
 */
export type LogoProps = WithClassNames<undefined>

/**
 * Logo — application brand mark that routes home when pressed.
 *
 * `"use client"` for the router press handler.
 * @param props - optional container class name
 */
export const Logo = ({ className }: LogoProps) => {
    const router = useRouter()

    /** Navigate to the localized home route. */
    const onPress = useCallback(
        () => router.push(pathConfig().locale().build()),
        [
            router,
        ],
    )
    return (
        <Link
            onPress={onPress}
            className={cn(className)}
        >
            <LogoMark className="size-10" />
        </Link>
    )
}
