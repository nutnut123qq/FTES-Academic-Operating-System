"use client"

import useSWR from "swr"

import { listChallenges } from "@/modules/api/rest/challenges/challenges"
import type { ChallengeView } from "@/modules/api/rest/challenges/types"

/** Domain of a challenge (drives the icon + type chip). */
export type ChallengeType = "coding" | "sql" | "uiux" | "ai" | "business"

/**
 * A challenge in the catalog (§10). Maps the BE `ChallengeView`
 * (`GET /api/v1/challenges`). Fields the BE view does not carry (difficulty,
 * points, participant count) are intentionally absent — the UI hides them
 * rather than fabricate values.
 */
export interface Challenge {
    /** Routing id — the BE `slug`. The detail endpoint keys on slug, NOT the uuid. */
    id: string
    /** Human title, e.g. "Two Sum". */
    title: string
    /** Domain of the challenge (drives the icon + type chip). */
    type: ChallengeType
    /** Lifecycle status from the BE (`PUBLISHED` | `RUNNING` | `CLOSED`). */
    status: string
}

/**
 * Maps a BE challenge `type` string (`CODING`, `SQL`, `UI_UX`, `AI`, `BUSINESS`)
 * onto the FE domain union. Unknown/unset → `coding` (a reachable facet beats a
 * broken icon/label lookup).
 */
export const mapChallengeType = (raw: string | null | undefined): ChallengeType => {
    switch ((raw ?? "").toUpperCase().replace(/[\s_-]/g, "")) {
        case "SQL":
            return "sql"
        case "UIUX":
            return "uiux"
        case "AI":
            return "ai"
        case "BUSINESS":
            return "business"
        case "CODING":
        default:
            return "coding"
    }
}

/** Maps one BE `ChallengeView` onto the catalog `Challenge` model. */
export const toChallenge = (view: ChallengeView): Challenge => ({
    id: view.slug,
    title: view.title,
    type: mapChallengeType(view.type),
    status: view.status,
})

/** Loads the challenge catalog from the real BE (`GET /api/v1/challenges`). */
export const useQueryChallengesSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["challenges"], async () => {
        const views = await listChallenges()
        return views.map(toChallenge)
    })
    return { challenges: data ?? [], isLoading, error, mutate }
}
