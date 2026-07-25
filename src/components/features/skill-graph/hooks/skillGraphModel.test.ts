import { describe, expect, it } from "vitest"
import type { CareerSkill, CareerSkillProgress } from "@/modules/api/rest/career"
import {
    buildSkillGraph,
    domainForCategory,
    masteryOf,
    maxLevelOf,
    readRelation,
    scopeGraphToSkills,
    statusOf,
} from "./skillGraphModel"

/** Minimal `CareerSkill` factory (only the fields the mapping reads matter). */
const skill = (id: string, name: string, category: string, levels: string): CareerSkill =>
    ({
        id,
        slug: name.toLowerCase(),
        name,
        category,
        levels,
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
    }) as CareerSkill

/** Minimal `CareerSkillProgress` factory. */
const progress = (skillId: string, level: number): CareerSkillProgress =>
    ({
        userId: "u1",
        skillId,
        level,
        progressPoints: 0,
        eligibleLevel: level,
        sourceBreakdown: "{}",
        updatedAt: "2026-01-01T00:00:00Z",
    }) as CareerSkillProgress

const LADDER_5 = '[{"level":1},{"level":2},{"level":3},{"level":4},{"level":5}]'
const LADDER_2 = '[{"level":1,"threshold":0},{"level":2,"threshold":100}]'

describe("domainForCategory", () => {
    it("folds BE categories into the six UI domains", () => {
        expect(domainForCategory("DATABASE")).toBe("data")
        expect(domainForCategory("MOBILE_DEV")).toBe("mobile")
        expect(domainForCategory("AI")).toBe("ai")
        expect(domainForCategory("CLOUD")).toBe("devops")
        expect(domainForCategory("FRONTEND")).toBe("fe")
        expect(domainForCategory("FRAMEWORK")).toBe("be")
    })

    it("defaults to `be` for an unknown / missing category", () => {
        expect(domainForCategory("SOMETHING_NEW")).toBe("be")
        expect(domainForCategory(null)).toBe("be")
    })
})

describe("level → mastery", () => {
    it("reads the top of a skill's own ladder", () => {
        expect(maxLevelOf(LADDER_2)).toBe(2)
        expect(maxLevelOf(LADDER_5)).toBe(5)
        expect(maxLevelOf("not json")).toBe(5)
        expect(maxLevelOf(undefined)).toBe(5)
    })

    it("normalises the learner level against that ladder", () => {
        expect(masteryOf(2, 2)).toBe(100)
        expect(masteryOf(2, 5)).toBe(40)
        expect(masteryOf(0, 5)).toBe(0)
    })

    it("buckets the status at the ends of the ladder", () => {
        expect(statusOf(0, 5)).toBe("locked")
        expect(statusOf(3, 5)).toBe("learning")
        expect(statusOf(2, 2)).toBe("mastered")
    })
})

describe("readRelation", () => {
    it("accepts the BE snake_case row and the FE camelCase type", () => {
        expect(readRelation({ skill_id: "a", related_id: "b", relation: "REQUIRES" })).toEqual({
            skillId: "a",
            relatedId: "b",
            relation: "REQUIRES",
        })
        expect(readRelation({ skillId: "a", relatedId: "b", relation: "RELATED" })).toEqual({
            skillId: "a",
            relatedId: "b",
            relation: "RELATED",
        })
    })

    it("rejects rows without both endpoints", () => {
        expect(readRelation({ skill_id: "a" })).toBeNull()
        expect(readRelation(null)).toBeNull()
    })
})

describe("buildSkillGraph", () => {
    const skills = [
        skill("s1", "Java Core", "LANGUAGE", LADDER_5),
        skill("s2", "Spring Boot", "FRAMEWORK", LADDER_5),
        skill("s3", "SQL", "DATABASE", LADDER_2),
    ]
    const relations = [
        { skill_id: "s2", related_id: "s1", relation: "REQUIRES" },
        { skill_id: "s3", related_id: "s2", relation: "RELATED" },
        { skill_id: "s9", related_id: "s1", relation: "REQUIRES" },
    ]

    it("maps skills + progress into mastery-encoded nodes", () => {
        const graph = buildSkillGraph(skills, relations, [progress("s1", 5), progress("s3", 1)])

        expect(graph.nodes.map((node) => node.id)).toEqual(["s1", "s2", "s3"])
        expect(graph.nodes[0]).toMatchObject({ domain: "be", level: 100, status: "mastered" })
        // no progress row → locked at 0
        expect(graph.nodes[1]).toMatchObject({ level: 0, status: "locked" })
        // SQL: level 1 of a 2-level ladder
        expect(graph.nodes[2]).toMatchObject({ domain: "data", level: 50, status: "learning" })
    })

    it("orients REQUIRES prerequisite → dependant and drops dangling edges", () => {
        const graph = buildSkillGraph(skills, relations, [])

        expect(graph.edges).toEqual([
            { id: "pre-s1-s2", source: "s1", target: "s2", kind: "prerequisite" },
            { id: "rel-s3-s2", source: "s3", target: "s2", kind: "related" },
        ])
    })

    it("survives empty payloads (guest with no progress)", () => {
        expect(buildSkillGraph([], [], [])).toEqual({ nodes: [], edges: [] })
    })
})

describe("scopeGraphToSkills", () => {
    const graph = buildSkillGraph(
        [
            skill("s1", "Java Core", "LANGUAGE", LADDER_5),
            skill("s2", "Spring Boot", "FRAMEWORK", LADDER_5),
            skill("s3", "SQL", "DATABASE", LADDER_2),
            skill("s4", "React", "FRONTEND", LADDER_5),
        ],
        [
            { skill_id: "s2", related_id: "s1", relation: "REQUIRES" },
            { skill_id: "s3", related_id: "s2", relation: "RELATED" },
        ],
        [],
    )

    it("keeps the anchors plus their 1-hop neighbors", () => {
        const scoped = scopeGraphToSkills(graph, ["s1"])
        expect(scoped.nodes.map((node) => node.id).sort()).toEqual(["s1", "s2"])
        expect(scoped.edges.map((edge) => edge.id)).toEqual(["pre-s1-s2"])
    })

    it("falls back to the full graph when the subject maps to nothing known", () => {
        expect(scopeGraphToSkills(graph, ["unknown"])).toBe(graph)
        expect(scopeGraphToSkills(graph, [])).toBe(graph)
    })
})
