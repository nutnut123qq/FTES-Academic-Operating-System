"use client"

import useSWR from "swr"
import { useAppSelector } from "@/redux/hooks"
import { getResourceDetail } from "@/modules/api/rest/resource"
import {
    getSubjectMembers,
    getSubjectStatistics,
} from "@/modules/api/rest/subject/subject"
import type { MemberView, StatisticsView } from "@/modules/api/rest/subject/types"

/**
 * A user referenced by a statistics row. The BE statistics payload carries the
 * raw `userId` ONLY, so the display identity is joined in from
 * `GET /subjects/{code}/members`:
 *
 * - member found → real `username` / `displayName` / `avatarUrl` (the row links to
 *   the public profile),
 * - member missing (left the subject, or ranks beyond the fetched member page) →
 *   `displayName` stays `null` and the renderer labels the row by {@link shortId}.
 *   No name is ever fabricated.
 */
export interface SubjectStatUser {
    /** Raw user UUID from the statistics payload. */
    id: string
    /** Short `12345678`-style handle, used when no member row resolves the name. */
    shortId: string
    /** Profile handle; `null` → the row renders without a profile link. */
    username: string | null
    /** Human name, or `null` when the member join found nothing. */
    displayName: string | null
    /** Uploaded avatar; `null` falls back to the generated (seeded) face. */
    avatar: string | null
    /** Marks the signed-in viewer's own row. */
    isViewer: boolean
}

/** One entry of the "top students" board (`topStudents[]`). */
export interface SubjectTopStudent {
    user: SubjectStatUser
    /** `TopStudentView.xp` — subject-scoped XP. */
    xp: number
    /** `TopStudentView.rank` — 1-based, computed by the BE. */
    rank: number
}

/** One entry of the "top contributors" board (`topContributors[]`). */
export interface SubjectTopContributor {
    user: SubjectStatUser
    /** `TopContributorView.contributions` — resources + posts created. */
    contributions: number
}

/** One entry of the "popular resources" board (`popularResources[]`). */
export interface SubjectPopularResource {
    /** Real resource UUID — routes to `/resources/{id}`. */
    id: string
    /** Short handle used when the resource title could not be resolved. */
    shortId: string
    /** Title joined in from `GET /resources/{id}`; `null` when unresolved. */
    title: string | null
    /** `PopularResourceView.views`. */
    views: number
    /** `PopularResourceView.downloads`. */
    downloads: number
}

/** One entry of the XP leaderboard (`leaderboard[]`, Redis ZSET-backed). */
export interface SubjectLeaderboardRow {
    user: SubjectStatUser
    /** `LeaderboardEntry.score`. */
    score: number
    /** `LeaderboardEntry.rank` — 1-based. */
    rank: number
}

/** Subject statistics, mapped from the real BE statistics endpoint. */
export interface SubjectStats {
    /**
     * Subject CODE these figures belong to (upper-cased) — carried so a cached entry
     * can never be shown under another subject (see {@link useQuerySubjectStatsSwr}).
     */
    code: string
    /**
     * Completion rate as a whole percent (0..100), or `null` when the BE has not
     * computed one yet (no snapshot, or no linked course with enrollments). Null is
     * rendered as "—", never as 0%.
     */
    completionRate: number | null
    /** Active members of the subject workspace. */
    memberCount: number
    /** Community posts scoped to the subject. */
    postCount: number
    /** Curated resources of the subject. */
    resourceCount: number
    topStudents: Array<SubjectTopStudent>
    topContributors: Array<SubjectTopContributor>
    popularResources: Array<SubjectPopularResource>
    leaderboard: Array<SubjectLeaderboardRow>
    /** ISO timestamp of the last worker recompute; `null` before the first run. */
    computedAt: string | null
    /** True when the subject has no figures at all yet (fresh workspace). */
    isEmpty: boolean
}

/** Minimal shape needed to label a popular resource. */
export interface ResourceTitleRef {
    id: string
    title: string
}

/** `bd1f0f0e-…` → `bd1f0f0e`. */
const shortHandle = (id: string) => (id ?? "").split("-")[0] || (id ?? "")

/**
 * Resolves a statistics `userId` against the subject's member list. Missing rows
 * degrade to an id-only identity — deliberately WITHOUT a name, so the renderer
 * can label them honestly instead of showing a raw UUID as if it were a name.
 */
const resolveUser = (
    userId: string,
    byUserId: Map<string, MemberView>,
    viewerId?: string | null,
): SubjectStatUser => {
    const member = byUserId.get(userId)
    return {
        id: userId,
        shortId: shortHandle(userId),
        username: member?.username ?? null,
        displayName: member?.displayName || member?.username || null,
        avatar: member?.avatarUrl ?? null,
        isViewer: Boolean(viewerId) && userId === viewerId,
    }
}

/**
 * Maps `GET /subjects/{code}/statistics` → the Statistics tab view model.
 *
 * Every figure is BE-backed:
 * - `completionRate` is already a 0..100 percent (BigDecimal, 2dp) and stays
 *   `null` when the BE could not compute one — the metric card then shows "—",
 * - `memberCount` / `postCount` / `resourceCount` come straight from the snapshot,
 * - `topStudents` / `topContributors` / `leaderboard` carry only a `userId`, so the
 *   member list resolves the display identity (see {@link resolveUser}),
 * - `popularResources` carries only a `resourceId`; titles are joined in from
 *   `GET /resources/{id}` and the row links to `/resources/{id}` regardless.
 *
 * Ranked lists are sorted by the BE rank so a renderer using the array index stays
 * in sync with the server ranking.
 *
 * @param statistics - the raw statistics payload.
 * @param members - member rows used to resolve username/displayName/avatar.
 * @param resources - `{id,title}` refs used to label popular resources.
 * @param viewerId - the signed-in user's id, used to flag the viewer's own rows.
 * @param code - the subject CODE the figures were read for, stamped on the result.
 */
export const mapSubjectStatistics = (
    statistics: StatisticsView | null | undefined,
    members: Array<MemberView> = [],
    resources: Array<ResourceTitleRef> = [],
    viewerId?: string | null,
    code = "",
): SubjectStats => {
    const byUserId = new Map(members.map((member) => [member.userId, member]))
    const titleById = new Map(resources.map((resource) => [resource.id, resource.title]))

    const rawCompletion = statistics?.completionRate
    const completionRate =
        rawCompletion === null || rawCompletion === undefined ? null : Number(rawCompletion)

    const topStudents = (statistics?.topStudents ?? [])
        .map((student) => ({
            user: resolveUser(student.userId, byUserId, viewerId),
            xp: student.xp ?? 0,
            rank: student.rank ?? Number.MAX_SAFE_INTEGER,
        }))
        .sort((left, right) => left.rank - right.rank)

    const topContributors = (statistics?.topContributors ?? []).map((contributor) => ({
        user: resolveUser(contributor.userId, byUserId, viewerId),
        contributions: contributor.contributions ?? 0,
    }))

    const popularResources = (statistics?.popularResources ?? []).map((resource) => ({
        id: resource.resourceId,
        shortId: shortHandle(resource.resourceId),
        title: titleById.get(resource.resourceId) ?? null,
        views: resource.views ?? 0,
        downloads: resource.downloads ?? 0,
    }))

    const leaderboard = (statistics?.leaderboard ?? [])
        .map((entry) => ({
            user: resolveUser(entry.userId, byUserId, viewerId),
            score: entry.score ?? 0,
            rank: entry.rank ?? Number.MAX_SAFE_INTEGER,
        }))
        .sort((left, right) => left.rank - right.rank)

    const memberCount = statistics?.memberCount ?? 0
    const postCount = statistics?.postCount ?? 0
    const resourceCount = statistics?.resourceCount ?? 0

    return {
        code,
        completionRate:
            completionRate === null || Number.isNaN(completionRate) ? null : completionRate,
        memberCount,
        postCount,
        resourceCount,
        topStudents,
        topContributors,
        popularResources,
        leaderboard,
        computedAt: statistics?.computedAt ?? null,
        isEmpty:
            completionRate === null &&
            memberCount === 0 &&
            postCount === 0 &&
            resourceCount === 0 &&
            topStudents.length === 0 &&
            topContributors.length === 0 &&
            popularResources.length === 0 &&
            leaderboard.length === 0,
    }
}

/**
 * Fetches the titles of the popular resources. The BE caps the board at 10 rows,
 * so this is a bounded fan-out of public `GET /resources/{id}` reads; each is
 * best-effort — a deleted/private resource simply keeps its id-only label instead
 * of failing the tab.
 */
const fetchResourceTitles = async (
    ids: Array<string>,
): Promise<Array<ResourceTitleRef>> => {
    if (ids.length === 0) {
        return []
    }
    const settled = await Promise.allSettled(ids.map((id) => getResourceDetail(id)))
    return settled.flatMap((result) =>
        result.status === "fulfilled" && result.value?.title
            ? [{ id: result.value.id, title: result.value.title }]
            : [],
    )
}

/**
 * Loads a subject's statistics from the real BE
 * (`GET /api/v1/subjects/{code}/statistics`, public + Redis-cached) and enriches
 * the id-only rows: member names/avatars from `GET /subjects/{code}/members`,
 * resource titles from `GET /resources/{id}`. Both joins are best-effort — a
 * failure there degrades the labels, never the figures.
 *
 * A subject whose worker has not computed a snapshot yet answers all-zero/empty
 * (not an error); `stats.isEmpty` flags exactly that case for the empty state.
 *
 * `keepPreviousData` keeps the previous cache entry on screen while a new key loads —
 * and KEEPS it when that load fails. The key carries the subject code, so a leftover
 * entry is another SUBJECT's figures, not merely an older page of the same one:
 * anything whose stamped `code` is not the requested one is dropped, which turns a
 * failed read back into a real error state instead of a silent cross-subject swap.
 * A key change that only swaps `viewerId` (same code) still reuses the data.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 */
export const useQuerySubjectStatsSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { data, isLoading, isValidating, error, mutate } = useSWR(
        code ? (["subject-stats", code, viewerId ?? null] as const) : null,
        async (): Promise<SubjectStats> => {
            const [statistics, members] = await Promise.all([
                getSubjectStatistics(code),
                // names are a nicety — never fail the tab over them
                getSubjectMembers(code, { size: 100 })
                    .then((page) => page?.items ?? [])
                    .catch(() => [] as Array<MemberView>),
            ])
            const resources = await fetchResourceTitles(
                (statistics?.popularResources ?? []).map((resource) => resource.resourceId),
            )
            return mapSubjectStatistics(statistics, members, resources, viewerId, code)
        },
        { keepPreviousData: true },
    )
    const stats = data && data.code === code ? data : undefined
    return { stats, isLoading, isValidating, error, mutate }
}
