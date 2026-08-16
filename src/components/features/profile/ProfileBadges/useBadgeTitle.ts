"use client"

import { useCallback } from "react"
import { useTranslations } from "next-intl"
import { badgeCodeFromTitle, humanizeBadgeCode } from "./model"

/**
 * Returns a resolver that turns a stored achievement title into something a
 * human can read.
 *
 * The backend writes `"Badge FIRST_LESSON"` whenever the award event carried no
 * `badgeName` (and every row written before that field existed still reads that
 * way), so a raw code WILL reach the UI unless it is resolved on the read path.
 * Resolution order:
 *
 *   1. the title is already human → returned verbatim;
 *   2. `gamification.milestones.<CODE>.name` when the locale has that badge;
 *   3. the humanized code (`FIRST_LESSON` → `First Lesson`) — a badge the
 *      backend seeded after this release still never shows as a raw code.
 */
export const useBadgeTitle = () => {
    const t = useTranslations()

    return useCallback(
        (title: string | null | undefined): string => {
            const raw = (title ?? "").trim()
            const code = badgeCodeFromTitle(raw)
            if (!code) {
                return raw
            }
            const key = `gamification.milestones.${code}.name`
            return t.has(key) ? t(key) : humanizeBadgeCode(code)
        },
        [t],
    )
}
