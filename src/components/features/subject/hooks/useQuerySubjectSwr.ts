"use client"

import useSWR from "swr"
import { getSubjectDetail } from "@/modules/api/rest/subject/subject"
import type { SubjectDetail, SubjectSummary } from "@/modules/api/rest/subject/types"

/** A subject workspace's identity, mapped from the real BE subject module. */
export interface Subject {
    /**
     * Route id (`[subjectId]`). The BE keys detail/workspace on the **course code**
     * (uuid → 404), so the id carried by every card + link is the code (`PRF192`).
     */
    id: string
    /**
     * Real subject UUID. The REST detail/workspace endpoints key on the code, but the
     * GraphQL `subjectWorkspace(subjectId: ID!)` op requires the UUID (a code inlined
     * there 500s "Internal error"), so the discussion feed reads this instead of `id`.
     */
    uuid: string
    /** Course code shown as the mark, e.g. `PRF192`. */
    code: string
    /** Human name — prefers the Vietnamese title (`nameVi`) for the VN UI. */
    name: string
    /** Credit count. */
    credits: number
    /** FE difficulty facet, bucketed from the BE `Difficulty` enum. */
    difficulty: "basic" | "intermediate" | "advanced"
    /**
     * Completion percent 0..100, or `null` when no per-user progress is available.
     * The public catalog/detail endpoints carry no per-viewer completion (that lives
     * on the auth-scoped `subjectMastery` GraphQL op), so this is `null` today and the
     * header progress meter is hidden rather than showing a fabricated figure.
     */
    progress: number | null
    /**
     * Cover/identity image, or `null` when the subject has no artwork. Every seeded
     * subject has `thumbnailUrl: null` today, so this exercises the initials-badge
     * fallback. Wire the host into `next.config` `images.remotePatterns` if the BE
     * ever serves remote thumbnails.
     */
    imageUrl: string | null
    /**
     * Ids of Course-module courses linked to this subject (link-out only). The BE
     * subject detail carries no course links (they live on the workspace `learning`
     * tab, empty today), so this is `[]` and the Overview link-out card stays hidden.
     */
    courseIds: Array<string>
    /**
     * Whether the viewer is a member of this workspace. The public detail endpoint
     * carries no caller membership (the workspace `callerMembership` is `null` for a
     * non-member), so this is `false` — the AI hub renders its honest locked state.
     */
    isMember: boolean
}

/** Maps the BE `Difficulty` enum (EASY|MEDIUM|HARD|VERY_HARD) to the FE 3-bucket facet. */
export const mapSubjectDifficulty = (
    be: string | null | undefined,
): Subject["difficulty"] => {
    switch (be) {
        case "EASY":
            return "basic"
        case "MEDIUM":
            return "intermediate"
        case "HARD":
        case "VERY_HARD":
            return "advanced"
        default:
            return "intermediate"
    }
}

/** Maps a catalog summary row (`GET /subjects`) to the FE {@link Subject}. */
export const toSubjectFromSummary = (summary: SubjectSummary): Subject => ({
    id: summary.code,
    uuid: summary.id,
    code: summary.code,
    name: summary.nameVi || summary.name,
    credits: summary.credits,
    difficulty: mapSubjectDifficulty(summary.difficulty),
    progress: null,
    imageUrl: summary.thumbnailUrl || null,
    courseIds: [],
    isMember: false,
})

/** Maps the full detail (`GET /subjects/{code}`) to the FE {@link Subject}. */
export const toSubjectFromDetail = (detail: SubjectDetail): Subject => ({
    id: detail.code,
    uuid: detail.id,
    code: detail.code,
    name: detail.nameVi || detail.name,
    credits: detail.credits,
    difficulty: mapSubjectDifficulty(detail.difficulty),
    progress: null,
    imageUrl: detail.thumbnailUrl || null,
    courseIds: [],
    isMember: false,
})

/**
 * Loads the subject for a workspace from the real BE (`GET /subjects/{code}`).
 * The BE keys on the uppercase course code, so the route segment is normalised
 * before the fetch.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 */
export const useQuerySubjectSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error } = useSWR(
        code ? (["subject", code] as const) : null,
        () => getSubjectDetail(code),
    )
    return {
        subject: data ? toSubjectFromDetail(data) : undefined,
        isLoading,
        error,
    }
}
