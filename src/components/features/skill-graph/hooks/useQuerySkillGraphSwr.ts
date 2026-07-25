"use client"

import useSWR from "swr"
import { getCareerSkills, getMyCareerSkills } from "@/modules/api/rest/career"
import { getSubjectWorkspace } from "@/modules/api/rest/subject"
import { buildSkillGraph, scopeGraphToSkills, type SkillGraphData, type SkillGraphScope } from "./skillGraphModel"

// The view-model types + the mapping helpers live in `skillGraphModel` (pure, unit
// tested); they are re-exported here so every consumer keeps a single import path.
export * from "./skillGraphModel"

/**
 * Loads the learner's skill graph from the career module.
 *
 * - `GET /api/v1/career/skills` → the public skill catalogue + relations,
 * - `GET /api/v1/career/me/skills` → the learner's per-skill level (guests / callers
 *   without the career permission simply get no progress, so every node reads as
 *   `locked` instead of the whole graph failing),
 * - when scoped, `GET /api/v1/subjects/{code}/workspace` → `careerBridge.relatedSkills`
 *   (the skill UUIDs mapped to that subject) narrows the graph to those skills + their
 *   1-hop neighbors.
 *
 * @param scope - optional `{ subjectId }` (the route segment = subject CODE).
 * @returns `{ graph, isLoading, error, mutate }` — `mutate` re-runs the fetch.
 */
export const useQuerySkillGraphSwr = (scope?: SkillGraphScope) => {
    const code = scope?.subjectId ? scope.subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        ["skill-graph", code || "full"] as const,
        async (): Promise<SkillGraphData> => {
            const [catalogue, progress, relatedSkills] = await Promise.all([
                getCareerSkills(),
                // Guests / callers without `career` access still get a readable graph.
                getMyCareerSkills().catch(() => []),
                code
                    ? getSubjectWorkspace(code)
                        .then((workspace) => workspace.careerBridge.data?.relatedSkills ?? [])
                        .catch(() => [] as Array<string>)
                    : Promise.resolve([] as Array<string>),
            ])

            const full = buildSkillGraph(
                catalogue?.skills ?? [],
                (catalogue?.relations ?? []) as Array<unknown>,
                progress ?? [],
            )
            return relatedSkills.length > 0 ? scopeGraphToSkills(full, relatedSkills) : full
        },
    )

    return { graph: data, isLoading, error, mutate }
}
