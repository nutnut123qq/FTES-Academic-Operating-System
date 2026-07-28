"use client"

import useSWR from "swr"
import { queryCourseLeaderboard } from "@/modules/api/graphql/queries/query-course-leaderboard"
import type { CourseLeaderboardEntry } from "@/modules/api/graphql/queries/types/course-leaderboard"
import { useAppSelector } from "@/redux/hooks"

/** The XP category a learner is ranked by (mirrors StarCI's course leaderboard). */
export type LeaderboardCategory = "total" | "challenges" | "reading" | "milestones"

/** All selectable categories (left rail order). */
export const LEADERBOARD_CATEGORIES: ReadonlyArray<LeaderboardCategory> = [
    "total",
    "challenges",
    "reading",
    "milestones",
]

/** XP per read lesson (mirrors BE `CourseLeaderboardAssembler.READING_XP`). */
export const READING_XP = 3
/**
 * XP per 1% of course completion (mirrors BE
 * `CourseLeaderboardAssembler.MILESTONE_XP_PER_PERCENT = 1`). `milestoneProgress`
 * is a percent 0..100, so `milestoneProgress × MILESTONE_XP` is its exact
 * contribution to the server `totalXp` — keep this at 1 so the three displayed
 * category XP figures decompose `totalXp` and don't over-represent the milestone slice.
 */
export const MILESTONE_XP = 1

/** Segment colours for the XP-composition bar (challenge / reading / milestone). */
export const CATEGORY_COLOR: Record<"challenges" | "reading" | "milestones", string> = {
    challenges: "#D85A30",
    reading: "#378ADD",
    milestones: "#1D9E75",
}

/** One ranked learner (server shape — client re-ranks per category). */
export interface LeaderboardEntry {
    /** Stable row key (enrollment). */
    enrollmentId: string
    /** User id — matches the viewer to highlight their row. */
    userId: string
    /** Username snapshot (may be empty when the public projection has none). */
    username: string
    /** Display name shown on the podium/table (falls back to a short id handle). */
    displayName: string
    /** Avatar URL or null (UserAvatar falls back to a generated one). */
    avatar: string | null
    /** Canonical total XP (the "total" category metric). */
    totalXp: number
    /** Challenge XP (1:1 with grader score). */
    totalScore: number
    /** Lessons read (× READING_XP for the reading category). */
    lessonsRead: number
    /** Course-completion percent 0..100 (× MILESTONE_XP for the milestones category). */
    milestoneProgress: number
}

/** The viewer's own snapshot (drives the per-category XP shown in the rail). */
export interface LeaderboardMyRank {
    /** 1-based rank across the WHOLE course population (server-computed, even out of window). */
    rank: number
    totalXp: number
    totalScore: number
    lessonsRead: number
    /** Course-completion percent 0..100. */
    milestoneProgress: number
}

/** The full leaderboard payload (mapped from the real `courseLeaderboard` query). */
export interface LeaderboardData {
    entries: Array<LeaderboardEntry>
    myRank: LeaderboardMyRank | null
    /** ISO timestamp the board was computed (shown as "updated at"; empty when unknown). */
    computedAt: string
}

/** XP a learner scores in a given category (sort + display metric). */
export const categoryEntryXp = (entry: LeaderboardEntry, key: LeaderboardCategory): number => {
    switch (key) {
    case "challenges":
        return entry.totalScore
    case "reading":
        return entry.lessonsRead * READING_XP
    case "milestones":
        return entry.milestoneProgress * MILESTONE_XP
    case "total":
    default:
        return entry.totalXp
    }
}

/** The viewer's XP in a given category (from myRank snapshot). */
export const categoryMyXp = (myRank: LeaderboardMyRank | null, key: LeaderboardCategory): number => {
    if (!myRank) {
        return 0
    }
    switch (key) {
    case "challenges":
        return myRank.totalScore
    case "reading":
        return myRank.lessonsRead * READING_XP
    case "milestones":
        return myRank.milestoneProgress * MILESTONE_XP
    case "total":
    default:
        return myRank.totalXp
    }
}

/** One ranked row (entry + 1-based display rank for the active category). */
export interface RankedLeaderboardEntry {
    entry: LeaderboardEntry
    displayRank: number
}

/** Client-side re-rank by the active category (stable, descending). */
export const rankEntriesByCategory = (
    entries: Array<LeaderboardEntry>,
    key: LeaderboardCategory,
): Array<RankedLeaderboardEntry> =>
    [...entries]
        .sort((a, b) => categoryEntryXp(b, key) - categoryEntryXp(a, key))
        .map((entry, index) => ({ entry, displayRank: index + 1 }))

/**
 * Maps a real backend `CourseLeaderboardEntry` onto the FE row model.
 *
 * The BE carries only a nullable `username` snapshot (no separate display name),
 * so `displayName` degrades to a short `#id` handle rather than a raw null — never
 * a fabricated name. Every number is copied straight from the server aggregate.
 */
const toEntry = (entry: CourseLeaderboardEntry): LeaderboardEntry => {
    const displayName = entry.username ?? `#${entry.userId.slice(0, 8)}`
    return {
        enrollmentId: entry.enrollmentId,
        userId: entry.userId,
        username: entry.username ?? "",
        displayName,
        avatar: entry.avatar,
        totalXp: entry.totalXp,
        totalScore: entry.totalScore,
        lessonsRead: entry.lessonsRead,
        milestoneProgress: entry.milestoneProgress,
    }
}

/**
 * Loads the course leaderboard from the real backend `courseLeaderboard(request)`
 * query (one payload; the board re-ranks per category client-side, mirroring
 * StarCI). Rows and the viewer's own standing come straight from the server
 * aggregate — an empty course legitimately yields `entries: []`, and the board
 * renders its clean empty-state instead of fake rows.
 *
 * The viewer id is derived from the redux user (`state.user.user?.id`), mirroring
 * the gamification/subject leaderboard hooks, and is returned so the board can
 * highlight the viewer's own podium/row.
 */
export const useQueryLearnLeaderboardSwr = (courseId: string) => {
    const viewerUserId = useAppSelector((state) => state.user.user?.id ?? null)

    const { data, isLoading, isValidating, error, mutate } = useSWR(
        courseId ? (["learn-leaderboard", courseId] as const) : null,
        async (): Promise<LeaderboardData> => {
            // Ask for the server-max window (MAX_LIMIT=100) so the client per-category
            // re-rank covers a broad population, not just the totalXp top-20 slice.
            const result = await queryCourseLeaderboard({ request: { courseId, limit: 100 } })
            const payload = result.data?.courseLeaderboard?.data
            const myRank = payload?.myRank
            return {
                entries: (payload?.entries ?? []).map(toEntry),
                myRank: myRank
                    ? {
                        rank: myRank.rank,
                        totalXp: myRank.totalXp,
                        totalScore: myRank.totalScore,
                        lessonsRead: myRank.lessonsRead,
                        milestoneProgress: myRank.milestoneProgress,
                    }
                    : null,
                computedAt: payload?.computedAt ?? "",
            }
        },
    )

    return {
        data,
        entries: data?.entries ?? [],
        myRank: data?.myRank ?? null,
        computedAt: data?.computedAt,
        /** The viewer's own public id (or `null`) — used to highlight the self row. */
        viewerUserId,
        isLoading,
        isValidating,
        error,
        mutate,
    }
}
