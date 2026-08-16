"use client"

import { useCallback } from "react"
import { useBadgeLabel } from "@/components/features/gamification/useBadgeLabel"
import { badgeCodeFromTitle } from "./model"

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
 *   2. otherwise the recovered code goes through the SHARED badge-label
 *      resolver ({@link useBadgeLabel}): curated translation, else the
 *      humanized code (an achievement row carries no backend badge name).
 */
export const useBadgeTitle = () => {
    const badgeLabel = useBadgeLabel()

    return useCallback(
        (title: string | null | undefined): string => {
            const raw = (title ?? "").trim()
            const code = badgeCodeFromTitle(raw)
            if (!code) {
                return raw
            }
            return badgeLabel(code)
        },
        [badgeLabel],
    )
}
