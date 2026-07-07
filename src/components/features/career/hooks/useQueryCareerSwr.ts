"use client"

import useSWR from "swr"
import {
    getCareerOpportunities,
    getCareerRoadmaps,
    getCareerSkills,
    getMyCareerSkills,
    type CareerOpportunity,
    type CareerRoadmap as CareerRoadmapDto,
    type CareerSkillGraph,
    type CareerSkillProgress,
} from "@/modules/api/rest/career"

/** A skill node in the graph, with the student's mastery % derived from the BE level. */
export interface CareerSkill {
    id: string
    name: string
    progress: number
}

/**
 * A published career roadmap (track). `track` picks the icon; `title` is the BE label.
 */
export interface CareerRoadmap {
    id: string
    slug: string
    title: string
    track: string
}

/** A career opportunity surfaced by the Career Center. `type` is the raw BE enum. */
export interface CareerJob {
    id: string
    title: string
    company: string
    type: string
}

export interface CareerCenterData {
    skills: Array<CareerSkill>
    roadmaps: Array<CareerRoadmap>
    jobs: Array<CareerJob>
}

/**
 * Parses the skill's `levels` jsonb (`[{level, name, threshold}, …]`) and returns the
 * highest defined level, so a student `level` can be expressed as a percentage of mastery.
 * Falls back to 5 (the BE mentor-assessment ceiling) when the column is empty/unparseable.
 */
const parseMaxLevel = (levelsJson: string | undefined): number => {
    if (!levelsJson) return 5
    try {
        const levels = JSON.parse(levelsJson) as Array<{ level?: number }>
        const max = Math.max(...levels.map((l) => Number(l.level ?? 0)))
        return Number.isFinite(max) && max > 0 ? max : 5
    } catch {
        return 5
    }
}

/** Maps a BE skill-progress row + the skill graph to the section's `{id, name, progress}`. */
const toSkill = (
    progress: CareerSkillProgress,
    graph: CareerSkillGraph | null,
): CareerSkill => {
    const skill = graph?.skills.find((s) => s.id === progress.skillId)
    const maxLevel = parseMaxLevel(skill?.levels)
    const pct = Math.round((Number(progress.level) / maxLevel) * 100)
    return {
        id: progress.skillId,
        // Degrade to the id when the graph lacks the skill — never fabricate a name.
        name: skill?.name ?? progress.skillId,
        progress: Math.min(100, Math.max(0, Number.isFinite(pct) ? pct : 0)),
    }
}

const toRoadmap = (roadmap: CareerRoadmapDto): CareerRoadmap => ({
    id: roadmap.id,
    slug: roadmap.slug,
    title: roadmap.title,
    track: roadmap.track ?? "",
})

const toJob = (opportunity: CareerOpportunity): CareerJob => ({
    id: opportunity.id,
    title: opportunity.title,
    company: opportunity.company ?? "",
    type: opportunity.type,
})

/**
 * Loads the Career Center (§21) from the real backend REST API.
 *
 * Each section is fetched independently and degraded to an empty list on failure, so a
 * blocked/empty section never breaks the others:
 * - roadmaps  → `GET /career/roadmaps` (public, published tracks)
 * - jobs      → `GET /career/opportunities?status=OPEN` (public)
 * - skills    → `GET /career/me/skills` joined with `GET /career/skills` (skill names).
 *   The `me/*` endpoints currently 403 backend-side (`CareerAccess.currentUserId` cannot
 *   resolve the platform principal to a `users.id`), so the skill graph section renders its
 *   graceful empty-state until that BE auth gap is fixed — the mapping is already in place.
 */
const fetchCareerCenter = async (): Promise<CareerCenterData> => {
    const [roadmapsResult, jobsResult, skillsResult, graphResult] =
        await Promise.allSettled([
            getCareerRoadmaps(),
            getCareerOpportunities({ status: "OPEN" }),
            getMyCareerSkills(),
            getCareerSkills(),
        ])

    const roadmaps =
        roadmapsResult.status === "fulfilled"
            ? roadmapsResult.value.map(toRoadmap)
            : []
    const jobs =
        jobsResult.status === "fulfilled" ? jobsResult.value.map(toJob) : []
    const progress =
        skillsResult.status === "fulfilled" ? skillsResult.value : []
    const graph = graphResult.status === "fulfilled" ? graphResult.value : null
    const skills = progress.map((p) => toSkill(p, graph))

    return { skills, roadmaps, jobs }
}

/** Loads the Career Center (§21) from the backend REST API, SWR-shaped. */
export const useQueryCareerSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["career-center"], () =>
        fetchCareerCenter(),
    )
    return {
        skills: data?.skills ?? [],
        roadmaps: data?.roadmaps ?? [],
        jobs: data?.jobs ?? [],
        isLoading,
        error,
        mutate,
    }
}
