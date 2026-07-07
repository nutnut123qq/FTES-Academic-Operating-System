"use client"

import useSWR from "swr"

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
    /** Mastery level, 0–100. */
    level: number
    status: SkillStatus
    /** Related subject ids (link into the subject workspace). */
    subjectIds: Array<string>
    /** Related course ids. */
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
    subjectId?: string
}

/** All six career domains, in a stable order (drives seeded angular sectors). */
export const SKILL_DOMAINS: Array<SkillDomain> = ["be", "fe", "mobile", "ai", "data", "devops"]

// ponytail: mock BE — no skill-graph endpoint yet. Deterministic sample (~54 nodes).
const buildMockGraph = (): SkillGraphData => {
    // Per-domain skill lists (name, level, status). Deterministic — no randomness.
    const seed: Record<
        SkillDomain,
        Array<{ name: string; level: number; status: SkillStatus; subjectIds: Array<string>; courseIds: Array<string> }>
    > = {
        be: [
            { name: "REST API", level: 88, status: "mastered", subjectIds: ["PRN212"], courseIds: ["c-backend"] },
            { name: "SQL", level: 74, status: "mastered", subjectIds: ["DBI202"], courseIds: ["c-database"] },
            { name: "GraphQL", level: 46, status: "learning", subjectIds: ["PRN212"], courseIds: ["c-backend"] },
            { name: "Node.js", level: 62, status: "learning", subjectIds: ["PRN212"], courseIds: ["c-backend"] },
            { name: "Microservices", level: 12, status: "locked", subjectIds: [], courseIds: [] },
            { name: "Message Queue", level: 8, status: "locked", subjectIds: [], courseIds: [] },
            { name: "Caching", level: 30, status: "learning", subjectIds: [], courseIds: [] },
            { name: "Auth & Security", level: 55, status: "learning", subjectIds: ["PRN212"], courseIds: ["c-backend"] },
        ],
        fe: [
            { name: "HTML/CSS", level: 92, status: "mastered", subjectIds: ["WED201"], courseIds: ["c-frontend"] },
            { name: "JavaScript", level: 85, status: "mastered", subjectIds: ["WED201"], courseIds: ["c-frontend"] },
            { name: "TypeScript", level: 70, status: "learning", subjectIds: ["WED201"], courseIds: ["c-frontend"] },
            { name: "React", level: 66, status: "learning", subjectIds: ["WED201"], courseIds: ["c-frontend"] },
            { name: "Next.js", level: 40, status: "learning", subjectIds: [], courseIds: ["c-frontend"] },
            { name: "State Management", level: 22, status: "locked", subjectIds: [], courseIds: [] },
            { name: "Accessibility", level: 15, status: "locked", subjectIds: [], courseIds: [] },
        ],
        mobile: [
            { name: "React Native", level: 34, status: "learning", subjectIds: ["MMA301"], courseIds: [] },
            { name: "Flutter", level: 10, status: "locked", subjectIds: [], courseIds: [] },
            { name: "Kotlin", level: 18, status: "locked", subjectIds: ["MAD101"], courseIds: [] },
            { name: "Mobile UX", level: 28, status: "learning", subjectIds: ["MMA301"], courseIds: [] },
            { name: "Push Notifications", level: 6, status: "locked", subjectIds: [], courseIds: [] },
        ],
        ai: [
            { name: "Python", level: 78, status: "mastered", subjectIds: ["AIL303"], courseIds: ["c-ai"] },
            { name: "Machine Learning", level: 42, status: "learning", subjectIds: ["AIL303"], courseIds: ["c-ai"] },
            { name: "Deep Learning", level: 20, status: "locked", subjectIds: [], courseIds: ["c-ai"] },
            { name: "NLP", level: 14, status: "locked", subjectIds: [], courseIds: [] },
            { name: "Prompt Engineering", level: 52, status: "learning", subjectIds: [], courseIds: ["c-ai"] },
            { name: "Computer Vision", level: 9, status: "locked", subjectIds: [], courseIds: [] },
        ],
        data: [
            { name: "Data Analysis", level: 60, status: "learning", subjectIds: ["DBI202"], courseIds: ["c-data"] },
            { name: "Pandas", level: 48, status: "learning", subjectIds: [], courseIds: ["c-data"] },
            { name: "Data Visualization", level: 38, status: "learning", subjectIds: [], courseIds: ["c-data"] },
            { name: "ETL Pipelines", level: 16, status: "locked", subjectIds: [], courseIds: [] },
            { name: "Data Warehouse", level: 11, status: "locked", subjectIds: [], courseIds: [] },
            { name: "Statistics", level: 44, status: "learning", subjectIds: ["MAS291"], courseIds: [] },
        ],
        devops: [
            { name: "Git", level: 90, status: "mastered", subjectIds: [], courseIds: ["c-devops"] },
            { name: "Linux", level: 58, status: "learning", subjectIds: [], courseIds: ["c-devops"] },
            { name: "Docker", level: 45, status: "learning", subjectIds: [], courseIds: ["c-devops"] },
            { name: "CI/CD", level: 26, status: "learning", subjectIds: [], courseIds: [] },
            { name: "Kubernetes", level: 7, status: "locked", subjectIds: [], courseIds: [] },
            { name: "Cloud (AWS)", level: 19, status: "locked", subjectIds: [], courseIds: ["c-devops"] },
        ],
    }

    const nodes: Array<SkillNode> = []
    const idOf: Record<SkillDomain, Array<string>> = { be: [], fe: [], mobile: [], ai: [], data: [], devops: [] }
    for (const domain of SKILL_DOMAINS) {
        seed[domain].forEach((entry, index) => {
            const id = `${domain}-${index}`
            idOf[domain].push(id)
            nodes.push({ id, name: entry.name, domain, level: entry.level, status: entry.status, subjectIds: entry.subjectIds, courseIds: entry.courseIds })
        })
    }

    // Deterministic edges: chain prerequisites within a domain + a few cross-domain "related" links.
    const edges: Array<SkillEdge> = []
    for (const domain of SKILL_DOMAINS) {
        const ids = idOf[domain]
        for (let i = 1; i < ids.length; i += 1) {
            edges.push({ id: `pre-${ids[i - 1]}-${ids[i]}`, source: ids[i - 1], target: ids[i], kind: "prerequisite" })
        }
    }
    const related: Array<[string, string]> = [
        ["fe-1", "ai-0"], // JavaScript ↔ Python (both scripting)
        ["fe-3", "mobile-0"], // React ↔ React Native
        ["be-1", "data-0"], // SQL ↔ Data Analysis
        ["ai-0", "data-1"], // Python ↔ Pandas
        ["be-0", "fe-3"], // REST API ↔ React
        ["devops-2", "be-4"], // Docker ↔ Microservices
        ["data-0", "ai-1"], // Data Analysis ↔ Machine Learning
    ]
    for (const [source, target] of related) {
        edges.push({ id: `rel-${source}-${target}`, source, target, kind: "related" })
    }

    return { nodes, edges }
}

/** Narrow a full graph to a subject's skills + their 1-hop neighbors. */
const scopeToSubject = (graph: SkillGraphData, subjectId: string): SkillGraphData => {
    const direct = new Set(graph.nodes.filter((node) => node.subjectIds.includes(subjectId)).map((node) => node.id))
    if (direct.size === 0) {
        // No mapping for this subject → fall back to the full graph (still useful).
        return graph
    }
    const keep = new Set(direct)
    for (const edge of graph.edges) {
        if (direct.has(edge.source)) keep.add(edge.target)
        if (direct.has(edge.target)) keep.add(edge.source)
    }
    return {
        nodes: graph.nodes.filter((node) => keep.has(node.id)),
        edges: graph.edges.filter((edge) => keep.has(edge.source) && keep.has(edge.target)),
    }
}

const fetchSkillGraphMock = async (scope?: SkillGraphScope): Promise<SkillGraphData> => {
    const full = buildMockGraph()
    if (scope?.subjectId) {
        return scopeToSubject(full, scope.subjectId)
    }
    return full
}

/**
 * Loads the learner's skill graph. Mocked; SWR-shaped for a drop-in BE swap.
 * @param scope - Optional `{ subjectId }` to return a subject-scoped subgraph (skills + 1-hop neighbors).
 * @returns `{ graph, isLoading, error, mutate }` — `mutate` re-runs the fetch (error-state retry).
 */
export const useQuerySkillGraphSwr = (scope?: SkillGraphScope) => {
    const { data, isLoading, error, mutate } = useSWR(["skill-graph", scope?.subjectId ?? "full"], () =>
        fetchSkillGraphMock(scope),
    )
    return { graph: data, isLoading, error, mutate }
}
