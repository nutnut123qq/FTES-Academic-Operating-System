"use client"

import useSWR from "swr"
import { getSubjectWorkspace } from "@/modules/api/rest/subject/subject"

/** Headline counts for the subject-workspace join banner. */
export interface OverviewStats {
    members: number
    moderators: number
    resources: number
}

/** A community post shown on the overview (pinned or recent). */
export interface OverviewPost {
    id: string
    /** Display name of the author. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    timeLabel: string
    title: string
    snippet: string
    reactions: number
    comments: number
}

/** A resource shortcut row. `type` maps to `subjects.resources.types.*`. */
export interface OverviewResource {
    id: string
    title: string
    type: "pdf" | "slide" | "video" | "pe" | "fe" | "source" | "notes"
}

/** Difficulty of a highlighted challenge. */
export type OverviewDifficulty = "easy" | "medium" | "hard"

/** A highlighted challenge shortcut row. */
export interface OverviewChallenge {
    id: string
    title: string
    difficulty: OverviewDifficulty
}

/** An active member (initials avatar). */
export interface OverviewMember {
    id: string
    /** URL-facing username for profile link + hovercard. */
    username: string
    /** Display name shown in the avatar stack. */
    name: string
}

/** The subject-workspace overview payload (§ subject hub, mock until BE lands). */
export interface SubjectOverview {
    stats: OverviewStats
    pinnedPost: OverviewPost | null
    posts: Array<OverviewPost>
    newResources: Array<OverviewResource>
    challenges: Array<OverviewChallenge>
    activeMembers: Array<OverviewMember>
    /** Active members beyond the shown avatars (the "+N" pill). */
    activeOverflow: number
}

/**
 * Builds the overview from the real BE workspace aggregate
 * (`GET /api/v1/subjects/{code}/workspace`). Only figures the BE can honestly back
 * are surfaced: member/moderator counts (from the `members` tab) and the resource
 * count (from the `resources` tab). The community feed lives in a separate module
 * (not in the subject workspace payload), so `posts`/`pinnedPost`/`activeMembers`
 * degrade to empty — the hub renders its heading rows with no fabricated content.
 * Resource/challenge shortcut rows are mapped straight from the (empty today)
 * workspace link lists.
 */
const fetchOverview = async (code: string): Promise<SubjectOverview> => {
    const ws = await getSubjectWorkspace(code)
    const members = ws.members.data
    const resources = ws.resources.data
    const practice = ws.practice.data

    const resourceCount = resources
        ? Object.values(resources.categoryCounts).reduce((sum, n) => sum + n, 0)
        : 0

    return {
        stats: {
            members: members?.totalActive ?? 0,
            moderators: members?.countsByRole?.MODERATOR ?? 0,
            resources: resourceCount,
        },
        pinnedPost: null,
        posts: [],
        newResources: (resources?.links ?? []).map((link) => ({
            id: link.id,
            title: link.title,
            // the workspace link carries no resource-type facet → default label
            type: "notes" as const,
        })),
        challenges: (practice?.links ?? []).map((link) => ({
            id: link.id,
            title: link.title,
            // the workspace link carries no difficulty facet → default label
            difficulty: "medium" as const,
        })),
        activeMembers: [],
        activeOverflow: 0,
    }
}

/** Loads the subject-workspace overview from the real BE workspace aggregate. */
export const useQuerySubjectOverviewSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-overview", code] as const) : null,
        () => fetchOverview(code),
    )
    return { overview: data, isLoading, error, mutate }
}
