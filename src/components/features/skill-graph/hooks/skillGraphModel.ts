/**
 * Pure mapping between the career REST payloads and the skill-graph view model.
 *
 * Sources: `GET /api/v1/career/skills` (`{skills[], relations[]}`) and
 * `GET /api/v1/career/me/skills` (`SkillProgress[]`). The BE has no notion of the six
 * UI "domains" — it stores a free-form `category` (`LANGUAGE`, `FRAMEWORK`,
 * `DATABASE`, …) — so {@link domainForCategory} folds it into the palette's domains.
 * Mastery comes from the learner's `level` normalised by the skill's own `levels`
 * ladder (a 2-level skill at level 2 IS mastered).
 *
 * The relations rows are read tolerantly: the BE serves them straight from a
 * `JdbcTemplate.queryForList` (`skill_id` / `related_id` / `relation`) while the shared
 * FE client type declares camelCase, so both spellings are accepted.
 */
import type { CareerSkill, CareerSkillProgress } from "@/modules/api/rest/career"

/** Career domain a skill belongs to (§21 roadmap clusters). */
export type SkillDomain = "be" | "fe" | "mobile" | "ai" | "data" | "devops"

/** Mastery status of a skill node. */
export type SkillStatus = "locked" | "learning" | "mastered"

/** Kind of link between two skills. */
export type SkillEdgeKind = "prerequisite" | "related"

/** A single skill node in the graph. */
export interface SkillNode {
    id: string
    name: string
    domain: SkillDomain
    /** Mastery level, 0–100 (the learner's level over the skill's own ladder). */
    level: number
    status: SkillStatus
    /** Related subject ids — the career REST surface exposes none today. */
    subjectIds: Array<string>
    /** Related course ids — the career REST surface exposes none today. */
    courseIds: Array<string>
}

/** A directed/undirected link between two skill nodes. */
export interface SkillEdge {
    id: string
    source: string
    target: string
    kind: SkillEdgeKind
}

/** The full skill-graph payload. */
export interface SkillGraphData {
    nodes: Array<SkillNode>
    edges: Array<SkillEdge>
}

/** Optional scope narrowing the graph to a subject's skills + 1-hop neighbors. */
export interface SkillGraphScope {
    /** The `[subjectId]` route segment (the subject CODE). */
    subjectId?: string
}

/** All six career domains, in a stable order (drives seeded angular sectors). */
export const SKILL_DOMAINS: Array<SkillDomain> = ["be", "fe", "mobile", "ai", "data", "devops"]

/** Ordered category-keyword → domain rules; the FIRST match wins. */
const DOMAIN_RULES: Array<{ match: Array<string>; domain: SkillDomain }> = [
    { match: ["MOBILE", "ANDROID", "IOS", "FLUTTER"], domain: "mobile" },
    { match: ["AI", "ML", "MACHINE", "DEEP", "NLP", "LLM"], domain: "ai" },
    { match: ["DATA", "DATABASE", "SQL", "ANALYT", "BI"], domain: "data" },
    { match: ["DEVOPS", "CLOUD", "INFRA", "PLATFORM", "SRE", "SECURITY", "NETWORK"], domain: "devops" },
    { match: ["FRONT", "WEB", "UI", "UX", "DESIGN", "CSS"], domain: "fe" },
    { match: ["BACK", "SERVER", "API", "LANGUAGE", "FRAMEWORK"], domain: "be" },
]

/**
 * Folds a BE skill `category` into one of the six UI domains.
 *
 * @param category - the raw category (`LANGUAGE`, `DATABASE`, `MOBILE_DEV`, …).
 * @returns the matching domain; `be` when nothing matches (the backend default bucket).
 */
export const domainForCategory = (category?: string | null): SkillDomain => {
    const normalized = (category ?? "").toUpperCase()
    for (const rule of DOMAIN_RULES) {
        if (rule.match.some((token) => normalized.includes(token))) {
            return rule.domain
        }
    }
    return "be"
}

/**
 * Reads the top level of a skill's `levels` ladder (a JSON string of
 * `[{level,name,threshold}]`).
 *
 * @param levels - the raw JSON string.
 * @returns the highest declared level, or `5` when the ladder is missing/unparsable.
 */
export const maxLevelOf = (levels?: string | null): number => {
    if (!levels) {
        return 5
    }
    try {
        const parsed: unknown = JSON.parse(levels)
        if (!Array.isArray(parsed)) {
            return 5
        }
        const levelNumbers = parsed
            .map((entry) => {
                const value = (entry as { level?: unknown } | null)?.level
                return typeof value === "number" ? value : Number(value)
            })
            .filter((value) => Number.isFinite(value) && value > 0)
        return levelNumbers.length > 0 ? Math.max(...levelNumbers) : 5
    } catch {
        return 5
    }
}

/**
 * Converts a learner level to the 0–100 mastery the node size/progress meter reads.
 *
 * @param level - the learner's level for the skill.
 * @param maxLevel - the top level of that skill's ladder.
 * @returns a percentage clamped to 0–100.
 */
export const masteryOf = (level: number, maxLevel: number): number => {
    if (!Number.isFinite(level) || level <= 0) {
        return 0
    }
    const ceiling = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : 5
    return Math.max(0, Math.min(100, Math.round((level / ceiling) * 100)))
}

/**
 * Buckets a learner level into the node status.
 *
 * @param level - the learner's level for the skill.
 * @param maxLevel - the top level of that skill's ladder.
 * @returns `locked` at level 0, `mastered` at the top of the ladder, `learning` between.
 */
export const statusOf = (level: number, maxLevel: number): SkillStatus => {
    if (!Number.isFinite(level) || level <= 0) {
        return "locked"
    }
    const ceiling = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : 5
    return level >= ceiling ? "mastered" : "learning"
}

/** A relation row as it may arrive (snake_case from the BE, camelCase per the FE type). */
export interface SkillRelationRow {
    skillId: string
    relatedId: string
    relation: string
}

/**
 * Reads one relation row in either spelling.
 *
 * @param raw - the row from `relations[]`.
 * @returns the normalized row, or `null` when either endpoint is missing.
 */
export const readRelation = (raw: unknown): SkillRelationRow | null => {
    if (typeof raw !== "object" || raw === null) {
        return null
    }
    const row = raw as Record<string, unknown>
    const skillId = row.skillId ?? row.skill_id
    const relatedId = row.relatedId ?? row.related_id
    if (typeof skillId !== "string" || typeof relatedId !== "string") {
        return null
    }
    return {
        skillId,
        relatedId,
        relation: typeof row.relation === "string" ? row.relation : "RELATED",
    }
}

/**
 * Builds the graph view model from the career payloads.
 *
 * `REQUIRES` edges point prerequisite → dependant (`related_id` is the prerequisite of
 * `skill_id`), `UNLOCKS` the other way round; anything else renders as a `related` link.
 * Edges with a dangling endpoint (a non-ACTIVE skill) are dropped.
 *
 * @param skills - `GET /career/skills` → `skills[]`.
 * @param relations - `GET /career/skills` → `relations[]` (either spelling).
 * @param progress - `GET /career/me/skills` (empty for guests).
 * @returns nodes + edges for the canvas / list fallback.
 */
export const buildSkillGraph = (
    skills: Array<CareerSkill>,
    relations: Array<unknown>,
    progress: Array<CareerSkillProgress>,
): SkillGraphData => {
    const levelBySkill = new Map<string, number>()
    for (const entry of progress ?? []) {
        if (entry && typeof entry.skillId === "string") {
            levelBySkill.set(entry.skillId, Number(entry.level ?? 0))
        }
    }

    const nodes: Array<SkillNode> = (skills ?? []).map((skill) => {
        const maxLevel = maxLevelOf(skill.levels)
        const level = levelBySkill.get(skill.id) ?? 0
        return {
            id: skill.id,
            name: skill.name,
            domain: domainForCategory(skill.category),
            level: masteryOf(level, maxLevel),
            status: statusOf(level, maxLevel),
            // The career REST surface exposes no skill↔subject / skill↔course mapping.
            subjectIds: [],
            courseIds: [],
        }
    })

    const known = new Set(nodes.map((node) => node.id))
    const edges: Array<SkillEdge> = []
    for (const raw of relations ?? []) {
        const row = readRelation(raw)
        if (!row || !known.has(row.skillId) || !known.has(row.relatedId)) {
            continue
        }
        if (row.relation === "REQUIRES") {
            edges.push({
                id: `pre-${row.relatedId}-${row.skillId}`,
                source: row.relatedId,
                target: row.skillId,
                kind: "prerequisite",
            })
        } else if (row.relation === "UNLOCKS") {
            edges.push({
                id: `pre-${row.skillId}-${row.relatedId}`,
                source: row.skillId,
                target: row.relatedId,
                kind: "prerequisite",
            })
        } else {
            edges.push({
                id: `rel-${row.skillId}-${row.relatedId}`,
                source: row.skillId,
                target: row.relatedId,
                kind: "related",
            })
        }
    }

    return { nodes, edges }
}

/**
 * Narrows a graph to a set of skills plus their 1-hop neighbors.
 *
 * Used for the subject-scoped graph: the subject workspace `careerBridge.relatedSkills`
 * carries the skill UUIDs mapped to that subject.
 *
 * @param graph - the full graph.
 * @param skillIds - the anchor skill ids.
 * @returns the subgraph, or the full graph when no anchor is present in it.
 */
export const scopeGraphToSkills = (
    graph: SkillGraphData,
    skillIds: Array<string>,
): SkillGraphData => {
    const anchors = new Set(
        skillIds.filter((id) => graph.nodes.some((node) => node.id === id)),
    )
    if (anchors.size === 0) {
        // No mapping for this subject → the full graph is still the useful answer.
        return graph
    }
    const keep = new Set(anchors)
    for (const edge of graph.edges) {
        if (anchors.has(edge.source)) keep.add(edge.target)
        if (anchors.has(edge.target)) keep.add(edge.source)
    }
    return {
        nodes: graph.nodes.filter((node) => keep.has(node.id)),
        edges: graph.edges.filter((edge) => keep.has(edge.source) && keep.has(edge.target)),
    }
}
