"use client"

import { useCallback } from "react"
import { useTranslations } from "next-intl"
import { resolveBadgeLabel } from "./badgeLabel"

/**
 * The shared badge-label resolver every badge surface calls.
 *
 * Binds the active locale's `gamification.milestones` namespace to the pure
 * {@link resolveBadgeLabel} precedence (curated translation → backend `name` →
 * humanized code). Call sites pass the badge code plus the backend name when
 * they have one and render the result verbatim — no call site does its own
 * `t(\`gamification.milestones.…\`)` lookup, because an unguarded lookup paints
 * the raw key path for any milestone row seeded after the last release.
 *
 * @returns `(code, backendName?) => string` — stable across renders.
 */
export const useBadgeLabel = () => {
    const t = useTranslations("gamification.milestones")

    return useCallback(
        (code: string | null | undefined, backendName?: string | null): string =>
            resolveBadgeLabel(
                { has: (key) => t.has(key), get: (key) => t(key) },
                code,
                backendName,
            ),
        [t],
    )
}
