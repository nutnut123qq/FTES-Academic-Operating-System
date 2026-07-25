"use client"

import useSWR from "swr"
import { useAppSelector } from "@/redux/hooks"
import {
    getSubjectMembers,
    getSubjectStatistics,
} from "@/modules/api/rest/subject/subject"
import type {
    MemberView,
    StatisticsView,
} from "@/modules/api/rest/subject/types"

/**
 * One learner's ranked standing in a subject — a compact port of StarCI's
 * `CourseLeaderboardEntry`. `totalXp` is the canonical rank value; the three
 * sub-scores (challenge · reading · milestone) drive the stacked XP-composition
 * bar, exactly as StarCI's `LeaderboardTable` does.
 */
export interface SubjectLeaderboardEntry {
    id: string
    username: string
    /** Optional uploaded avatar; falls back to a generated face via `UserAvatar`. */
    avatar?: string | null
    /** Canonical rank value (challenge + reading + milestone). */
    totalXp: number
    /** XP from coding challenges. */
    challengeXp: number
    /** XP from reading lessons. */
    readingXp: number
    /** XP from milestones/tasks. */
    milestoneXp: number
    /** Marks the viewer's own row (accent + "Bạn" chip). */
    isViewer?: boolean
    /**
     * Rank as computed by the BE (`leaderboard[].rank`). Entries are returned
     * sorted by it, so a renderer deriving the position from the array index
     * stays in sync with the server ranking.
     */
    rank: number
}

/** Per-category accent colours for the XP-composition bar (mirrors StarCI). */
export const LEADERBOARD_CATEGORY_COLOR = {
    challenge: "#D85A30",
    reading: "#378ADD",
    milestone: "#1D9E75",
} as const

/**
 * Maps `GET /subjects/{code}/statistics` onto the leaderboard rows.
 *
 * The BE entry carries only `{userId, score, rank}`:
 * - `score` → `totalXp` (the ranked value actually rendered),
 * - the per-category breakdown (challenge/reading/milestone) has **no BE facet**,
 *   so it degrades to `0` across the board — the stacked bar then renders its
 *   neutral track instead of fabricating a split,
 * - the display name is joined in from `GET /subjects/{code}/members` when that
 *   row exists; otherwise it degrades to a short `#userId` handle rather than a
 *   raw UUID.
 *
 * Rows are sorted by `rank` ascending (missing ranks sink to the bottom).
 *
 * @param statistics - the raw statistics payload.
 * @param members - member rows used to resolve username/avatar (optional).
 * @param viewerId - the signed-in user's id, used to flag the viewer's own row.
 */
export const mapSubjectLeaderboard = (
    statistics: Pick<StatisticsView, "leaderboard"> | null | undefined,
    members: Array<MemberView> = [],
    viewerId?: string | null,
): Array<SubjectLeaderboardEntry> => {
    const byUserId = new Map(members.map((member) => [member.userId, member]))
    return (statistics?.leaderboard ?? [])
        .map((entry) => {
            const member = byUserId.get(entry.userId)
            return {
                id: entry.userId,
                username:
                    member?.displayName ||
                    member?.username ||
                    `#${entry.userId.slice(0, 8)}`,
                avatar: member?.avatarUrl ?? null,
                totalXp: entry.score ?? 0,
                // no per-category facet on the BE statistics entry
                challengeXp: 0,
                readingXp: 0,
                milestoneXp: 0,
                isViewer: Boolean(viewerId) && entry.userId === viewerId,
                rank: entry.rank ?? Number.MAX_SAFE_INTEGER,
            }
        })
        .sort((left, right) => left.rank - right.rank)
}

/**
 * Loads a subject's leaderboard from the real BE
 * (`GET /api/v1/subjects/{code}/statistics` → `leaderboard`), enriched with the
 * member list so rows show a human name. See {@link mapSubjectLeaderboard} for
 * the degrade rules.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 */
export const useQuerySubjectLeaderboardSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-leaderboard", code, viewerId ?? null] as const) : null,
        async (): Promise<Array<SubjectLeaderboardEntry>> => {
            const [statistics, members] = await Promise.all([
                getSubjectStatistics(code),
                // names are a nicety — never fail the board over them
                getSubjectMembers(code, { size: 100 })
                    .then((page) => page?.items ?? [])
                    .catch(() => [] as Array<MemberView>),
            ])
            return mapSubjectLeaderboard(statistics, members, viewerId)
        },
    )
    return { entries: data ?? [], isLoading, error, mutate }
}
