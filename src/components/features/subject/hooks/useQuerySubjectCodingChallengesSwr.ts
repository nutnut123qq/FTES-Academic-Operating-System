"use client"

import useSWR from "swr"
import {
    listChallenges,
    type ChallengeTagView,
    type ChallengeView,
} from "@/modules/api/rest/challenges"
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
    /** Thời điểm mở (ISO-8601). `null` = mở ngay, không hẹn giờ. */
    startsAt: string | null
    /** Thời điểm đóng (ISO-8601). `null` = KHÔNG giới hạn (không bao giờ tự đóng). */
    endsAt: string | null
    maxSubmissions: number
    /** Total submissions across all participants — the popularity signal for the "Hot" sort. */
    submissionCount: number
    /** Course-bank owner, when the challenge is scoped to a course. */
    courseId: string | null
    /**
     * Tags carried by the challenge (`pe` + the subject code for a Practical Exam paper
     * folded into the bank). Drives the tag filter row + the row chips; `[]` when the BE
     * ships none.
     */
    tags: Array<ChallengeTagView>
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
 * Lifecycle statuses that are NOT a listable challenge. `PENDING_APPROVAL` joined
 * `DRAFT` / `REJECTED` when the bank started accepting contributed papers: the BE list
 * already hides them, and this guard keeps the learner surfaces honest if a deployment
 * ever leaks one. `ARCHIVED` is deliberately absent — it stays listed as `closed`, the
 * behaviour the bank has always had.
 */
const UNLISTED_STATUSES = new Set(["DRAFT", "PENDING_APPROVAL", "REJECTED"])

/**
 * Whether a challenge belongs on a learner-facing list.
 *
 * @param view - the BE challenge payload.
 * @returns `false` for a draft / pending-approval / rejected row, `true` otherwise.
 */
export const isListableChallenge = (view: ChallengeView): boolean =>
    !UNLISTED_STATUSES.has(view.status)

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
    submissionCount: view.submissionCount ?? 0,
    courseId: view.courseId ?? null,
    tags: view.tags ?? [],
})

/**
 * Maps a page of BE views onto listable bank rows (drops the non-visible statuses).
 *
 * @param views - the raw list payload (nullable — a degraded read hands back `null`).
 * @param now - evaluation instant (ms) for the lifecycle bucket.
 * @returns the rows to render.
 */
export const toBankRows = (
    views: Array<ChallengeView> | null | undefined,
    now: number,
): Array<CodingChallenge> =>
    (views ?? []).filter(isListableChallenge).map((view) => mapChallengeView(view, now))

/**
 * TRANSITIONAL BELT over the server-side `subjectId` / `tags` narrowing.
 *
 * The two query params ship in a parallel BE lane. A deployment that does not know them
 * yet ignores them silently and answers the WHOLE bank — which would show every subject's
 * challenges under one subject's Practice tab, labelled as that subject's own. Re-checking
 * the constraint on the rows costs nothing when the BE honours the params (it drops
 * nothing) and keeps the surface truthful when it does not.
 *
 * Delete once every deployment serves the params.
 *
 * @param items - the rows the list endpoint answered with.
 * @param subjectUuid - the subject the rows were asked for, or `null` for the global bank.
 * @param tags - the tag slugs the rows must ALL carry.
 * @returns the rows that actually satisfy the requested narrowing.
 */
export const narrowBankRows = (
    items: Array<CodingChallenge>,
    subjectUuid: string | null,
    tags: Array<string>,
): Array<CodingChallenge> =>
    items.filter((item) => {
        if (subjectUuid && item.subjectId !== subjectUuid) {
            return false
        }
        const slugs = new Set(item.tags.map((tag) => tag.slug))
        return tags.every((slug) => slugs.has(slug))
    })

/**
 * Builds the tag facet row from the rows currently on screen.
 *
 * Two rules make the row usable while filtering with AND semantics:
 * - the facets NARROW to what still co-occurs with the current selection (picking `pe`
 *   leaves the subject codes that actually have PE papers, not every tag in the bank);
 * - an already-SELECTED slug is always kept, even if the server answered nothing, so the
 *   learner can always un-pick it instead of being stranded on an empty list.
 *
 * @param items - the rows the bank returned for the current filter.
 * @param selected - the slugs currently picked.
 * @returns `{slug,label}` facets, de-duplicated and sorted by label.
 */
export const collectChallengeTags = (
    items: Array<CodingChallenge>,
    selected: Array<string> = [],
): Array<ChallengeTagView> => {
    const bySlug = new Map<string, string>()
    for (const slug of selected) {
        bySlug.set(slug, slug)
    }
    for (const item of items) {
        for (const tag of item.tags) {
            bySlug.set(tag.slug, tag.label || tag.slug)
        }
    }
    return [...bySlug.entries()]
        .map(([slug, label]) => ({ slug, label }))
        .sort((left, right) => left.label.localeCompare(right.label))
}

/**
 * Loads the practice challenge bank for a subject.
 *
 * Real data: `GET /api/v1/subjects/{code}` (resolves the subject UUID) +
 * `GET /api/v1/challenges?subjectId=&tags=` — the narrowing is the BE's own query param
 * now, NOT a client-side `subjectId` filter over the global bank (the workaround that
 * lived here while the param was missing). The BE already hides DRAFT/ARCHIVED and
 * COURSE_ONLY course challenges from the list; {@link isListableChallenge} is the belt
 * for the newer `PENDING_APPROVAL` status.
 *
 * The "subject owns nothing → show the global bank with `scoped: false`" behaviour is
 * kept, just moved server-side: an empty subject-scoped page re-asks WITHOUT `subjectId`
 * (carrying the same tags), so the learner sees the public bank instead of a bogus empty
 * state and the list can say so.
 *
 * @param subjectId - the `[subjectId]` route segment (the subject CODE).
 * @param tags - tag slugs the rows must ALL carry (AND semantics); omit for no constraint.
 * @returns `{ challenges, scoped, isLoading, error, mutate }`.
 */
export const useQuerySubjectCodingChallengesSwr = (
    subjectId: string,
    tags: Array<string> = [],
) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    // Sorted + joined so the key is stable regardless of the order chips were picked in
    // (and identical to the unfiltered key when nothing is selected → one request).
    const tagKey = [...tags].sort().join(",")
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-coding-challenges", code, tagKey] as const) : null,
        async (): Promise<CodingChallengeBank> => {
            const selected = tagKey ? tagKey.split(",") : []
            // A missing/forbidden subject must not sink the bank — fall back to global.
            const detail = await getSubjectDetail(code).catch(() => null)
            const now = Date.now()
            if (detail?.id) {
                const mine = narrowBankRows(
                    toBankRows(await listChallenges({ subjectId: detail.id, tags: selected }), now),
                    detail.id,
                    selected,
                )
                if (mine.length > 0) {
                    return { items: mine, scoped: true }
                }
            }
            const all = toBankRows(await listChallenges({ tags: selected }), now)
            return { items: narrowBankRows(all, null, selected), scoped: false }
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
