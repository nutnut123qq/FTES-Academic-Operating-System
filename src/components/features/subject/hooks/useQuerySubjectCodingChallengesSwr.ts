"use client"

import useSWR from "swr"
import { listChallenges, type ChallengeView } from "@/modules/api/rest/challenges"
import { getSubjectDetail } from "@/modules/api/rest/subject"

/**
 * Challenge kinds, mirroring the BE `challenge.challenges.type` CHECK constraint
 * (`CODING`, `SQL`, `UIUX`, `AI`, `BUSINESS`).
 */
export const CHALLENGE_TYPES = ["CODING", "SQL", "UIUX", "AI", "BUSINESS"] as const

/** One BE challenge type. */
export type ChallengeType = (typeof CHALLENGE_TYPES)[number]

/** BE type → the `subjects.practice.coding.types.*` i18n key suffix. */
const TYPE_KEYS: Record<string, string> = {
    CODING: "coding",
    SQL: "sql",
    UIUX: "uiux",
    AI: "ai",
    BUSINESS: "business",
}

/**
 * Resolves the i18n key suffix of a challenge type.
 *
 * @param type - the raw BE type.
 * @returns the known suffix, or `null` when the BE ships a type the FE has no label
 * for (callers then render the raw value instead of throwing on a missing key).
 */
export const challengeTypeKey = (type: string): string | null => TYPE_KEYS[type] ?? null

/** Coarse lifecycle bucket derived from `status` + the challenge time window. */
export type ChallengeLifecycle = "running" | "upcoming" | "closed"

/** All lifecycle buckets, in display order. */
export const CHALLENGE_LIFECYCLES: Array<ChallengeLifecycle> = ["running", "upcoming", "closed"]

/**
 * A challenge row of the practice bank — the honest projection of BE `ChallengeView`.
 *
 * NOTE: the backend carries no `difficulty`, no acceptance rate and no per-user solved
 * flag on the list payload, so those facets (mock-only before) are gone; type + lifecycle
 * replace them as filters.
 */
export interface CodingChallenge {
    id: string
    slug: string
    title: string
    /** Problem statement (markdown text from the BE `description`). */
    description: string
    /** Raw BE type (`CODING` | `SQL` | `UIUX` | `AI` | `BUSINESS` | future values). */
    type: string
    /** `INDIVIDUAL` | `TEAM`. */
    mode: string
    /** Raw lifecycle status (`PUBLISHED` | `RUNNING` | `CLOSED` | …). */
    status: string
    /** Derived bucket used by the list filter. */
    lifecycle: ChallengeLifecycle
    /** Owning subject id (UUID) or `null` for global challenges. */
    subjectId: string | null
    startsAt: string
    endsAt: string
    maxSubmissions: number
    /** Course-bank owner, when the challenge is scoped to a course. */
    courseId: string | null
}

/** The bank payload: the rows plus whether they were narrowed to the subject. */
export interface CodingChallengeBank {
    items: Array<CodingChallenge>
    /**
     * `true` when the rows are the subject's own challenges; `false` when the subject
     * owns none and the full public list is shown instead (the list renders a note so
     * the learner is not misled).
     */
    scoped: boolean
}

/**
 * Buckets a challenge by its status and time window.
 *
 * @param view - the BE challenge payload.
 * @param now - evaluation instant (ms) — injected so the mapping stays testable.
 * @returns `closed` for CLOSED/ARCHIVED or a past window, `upcoming` before the start,
 * `running` otherwise.
 */
export const lifecycleOf = (view: ChallengeView, now: number): ChallengeLifecycle => {
    if (view.status === "CLOSED" || view.status === "ARCHIVED") {
        return "closed"
    }
    const ends = Date.parse(view.endsAt ?? "")
    if (Number.isFinite(ends) && ends < now) {
        return "closed"
    }
    const starts = Date.parse(view.startsAt ?? "")
    if (Number.isFinite(starts) && starts > now) {
        return "upcoming"
    }
    return "running"
}

/**
 * Maps a BE `ChallengeView` to a bank row.
 *
 * @param view - the BE payload.
 * @param now - evaluation instant (ms) for the lifecycle bucket.
 * @returns the row rendered by the list / detail panel.
 */
export const mapChallengeView = (view: ChallengeView, now: number): CodingChallenge => ({
    id: view.id,
    slug: view.slug,
    title: view.title,
    description: view.description ?? "",
    type: view.type,
    mode: view.mode,
    status: view.status,
    lifecycle: lifecycleOf(view, now),
    subjectId: view.subjectId ?? null,
    startsAt: view.startsAt,
    endsAt: view.endsAt,
    maxSubmissions: view.maxSubmissions,
    courseId: view.courseId ?? null,
})

/**
 * Narrows the global public list to one subject.
 *
 * `GET /api/v1/challenges` is global (the BE exposes no `subjectId` query param), so
 * the scoping happens client-side on `ChallengeView.subjectId`. When the subject owns
 * none, the full list is returned with `scoped: false` rather than a bogus empty state.
 *
 * @param items - every mapped public challenge.
 * @param subjectUuid - the subject's UUID, or `null` when it could not be resolved.
 * @returns the rows to render plus the `scoped` flag.
 */
export const scopeChallengesToSubject = (
    items: Array<CodingChallenge>,
    subjectUuid: string | null,
): CodingChallengeBank => {
    if (!subjectUuid) {
        return { items, scoped: false }
    }
    const mine = items.filter((item) => item.subjectId === subjectUuid)
    return mine.length > 0 ? { items: mine, scoped: true } : { items, scoped: false }
}

/**
 * Loads the practice challenge bank for a subject.
 *
 * Real data: `GET /api/v1/subjects/{code}` (resolves the subject UUID) +
 * `GET /api/v1/challenges` (the public bank — the BE already hides DRAFT/ARCHIVED and
 * COURSE_ONLY course challenges from it). Rows are scoped client-side afterwards.
 *
 * @param subjectId - the `[subjectId]` route segment (the subject CODE).
 * @returns `{ challenges, scoped, isLoading, error, mutate }`.
 */
export const useQuerySubjectCodingChallengesSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-coding-challenges", code] as const) : null,
        async (): Promise<CodingChallengeBank> => {
            const [detail, views] = await Promise.all([
                // A missing/forbidden subject must not sink the bank — fall back to global.
                getSubjectDetail(code).catch(() => null),
                listChallenges(),
            ])
            const now = Date.now()
            const items = (views ?? []).map((view) => mapChallengeView(view, now))
            return scopeChallengesToSubject(items, detail?.id ?? null)
        },
    )

    return {
        challenges: data?.items ?? [],
        scoped: data?.scoped ?? false,
        isLoading,
        error,
        mutate,
    }
}
