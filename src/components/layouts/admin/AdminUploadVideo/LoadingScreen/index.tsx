"use client"

import React from "react"
import {
    cn,
    Spinner,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LoadingScreen}. */
export type LoadingScreenProps = WithClassNames<undefined>

/**
 * Full-screen loading gate shown while the API key is being resolved.
 *
 * Presentational (render-only); "use client" because it relies on the HeroUI
 * Spinner client component.
 * @param props - optional className forwarded to the wrapper div
 */
export const LoadingScreen = ({
    className,
}: LoadingScreenProps = {}) => {
    return (
        <div className={cn("min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center", className)}>
            <Spinner size="lg" />
        </div>
    )
}
