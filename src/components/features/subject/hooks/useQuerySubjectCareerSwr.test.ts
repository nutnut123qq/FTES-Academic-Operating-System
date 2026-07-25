import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the Career Bridge (§21) mapping.
 *
 * The tab used to render fabricated data (a hard-coded `medium` "demand" per career and
 * the raw skill UUIDs as chips). The contract pinned here is the real one:
 *
 * - `careerBridge.relatedSkills` carries skill UUIDs → they must be joined against
 *   `GET /career/skills` for a name and against `GET /career/me/skills` for a level,
 *   degrading to the id (never a made-up name) when the catalogue lacks the skill;
 * - `recommendations.payload` is a jsonb column Hibernate maps onto a `String`, so it
 *   arrives as an ESCAPED JSON string — it must be parsed, and a plain object accepted;
 * - roadmap steps arrive snake_case from the backend `JdbcTemplate.queryForList`, so
 *   relatedness must read `skill_ids` / `subject_ids` as well as the camelCase spelling;
 * - a roadmap/opportunity is only "related to this subject" when the backend data proves
 *   it (skill overlap, subject reference, or a track inherited from a related roadmap).
 */

// The hook module pulls the REST clients in at import time.
vi.mock("@/modules/api/rest/career", () => ({
    getCareerOpportunities: vi.fn(),
    getCareerRoadmapDetail: vi.fn(),
    getCareerRoadmaps: vi.fn(),
    getCareerSkills: vi.fn(),
    getMyCareerApplications: vi.fn(),
    getMyCareerRecommendations: vi.fn(),
    getMyCareerRoadmaps: vi.fn(),
    getMyCareerSkills: vi.fn(),
}))
vi.mock("@/modules/api/rest/subject/subject", () => ({
    getSubjectWorkspace: vi.fn(),
}))

import type {
    CareerOpportunity,
    CareerRecommendation,
    CareerRoadmap,
    CareerRoadmapDetail,
    CareerSkill,
    CareerSkillProgress,
} from "@/modules/api/rest/career"
import {
    getCareerOpportunities,
    getCareerRoadmapDetail,
    getCareerRoadmaps,
    getCareerSkills,
    getMyCareerApplications,
    getMyCareerRecommendations,
    getMyCareerRoadmaps,
    getMyCareerSkills,
} from "@/modules/api/rest/career"
import { getSubjectWorkspace } from "@/modules/api/rest/subject/subject"
import type { WorkspaceView } from "@/modules/api/rest/subject/types"
import {
    fetchSubjectCareer,
    mapOpportunities,
    mapRoadmaps,
    mapSubjectSkills,
    parseJsonColumn,
    readCareerPath,
    readRoadmapStepRefs,
    readSkillTargets,
    sectionStatusOf,
} from "./useQuerySubjectCareerSwr"

const LADDER_5 =
    "[{\"level\":1},{\"level\":2},{\"level\":3},{\"level\":4},{\"level\":5}]"
const LADDER_2 = "[{\"level\":1},{\"level\":2}]"

/** Minimal catalogue skill (only the fields the mapping reads matter). */
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

/** Minimal progress row. */
const progress = (
    skillId: string,
    level: number,
    eligibleLevel = 0,
): CareerSkillProgress =>
    ({
        userId: "u1",
        skillId,
        level,
        progressPoints: 0,
        eligibleLevel,
        sourceBreakdown: "{}",
        updatedAt: "2026-01-01T00:00:00Z",
    }) as CareerSkillProgress

/** Minimal published roadmap. */
const roadmap = (id: string, slug: string, title: string, track: string): CareerRoadmap =>
    ({
        id,
        slug,
        title,
        track,
        status: "PUBLISHED",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
    }) as CareerRoadmap

/** Minimal open opportunity. */
const opportunity = (
    id: string,
    title: string,
    track: string,
    extra: Partial<CareerOpportunity> = {},
): CareerOpportunity =>
    ({
        id,
        type: "JOB",
        title,
        description: "",
        requiredSkills: "[]",
        track,
        remote: false,
        source: "FTES",
        status: "OPEN",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        ...extra,
    }) as CareerOpportunity

/** A recommendation row as the BE serialises it (jsonb column mapped to a String). */
const recommendation = (kind: string, payload: unknown): CareerRecommendation =>
    ({
        userId: "u1",
        kind,
        payload: typeof payload === "string" ? payload : JSON.stringify(payload),
        computedAt: "2026-01-01T00:00:00Z",
    }) as CareerRecommendation

const CATALOGUE = [
    skill("s1", "Java Core", "LANGUAGE", LADDER_5),
    skill("s2", "Spring Boot", "FRAMEWORK", LADDER_5),
    skill("s3", "SQL", "DATABASE", LADDER_2),
]

describe("parseJsonColumn", () => {
    it("parses the escaped JSON string the BE emits for a jsonb column", () => {
        expect(parseJsonColumn("{\"track\":\"BACKEND\"}")).toEqual({ track: "BACKEND" })
    })

    it("passes an already-parsed object straight through", () => {
        expect(parseJsonColumn({ track: "AI" })).toEqual({ track: "AI" })
    })

    it("degrades unparsable / missing values to null instead of throwing", () => {
        expect(parseJsonColumn("not json")).toBeNull()
        expect(parseJsonColumn(undefined)).toBeNull()
        expect(parseJsonColumn(null)).toBeNull()
    })
})

describe("readSkillTargets", () => {
    it("reads the NEXT_SKILL items keyed by skill id", () => {
        const targets = readSkillTargets([
            recommendation("NEXT_SKILL", {
                items: [
                    { skillId: "s1", currentLevel: 1, targetLevel: 3, gap: 2 },
                    { skillId: "s3", currentLevel: 0, targetLevel: 2 },
                ],
            }),
            recommendation("CAREER_PATH", { track: "BACKEND", score: 4 }),
        ])

        expect(targets.get("s1")).toEqual({ targetLevel: 3, gap: 2 })
        // gap missing → derived from target - current, never invented
        expect(targets.get("s3")).toEqual({ targetLevel: 2, gap: 2 })
        expect(targets.has("s2")).toBe(false)
    })

    it("is empty when the worker computed no recommendation", () => {
        expect(readSkillTargets([]).size).toBe(0)
    })
})

describe("readCareerPath", () => {
    it("reads the CAREER_PATH track + score", () => {
        expect(
            readCareerPath([recommendation("CAREER_PATH", { track: "BACKEND", score: 7 })]),
        ).toEqual({ track: "BACKEND", score: 7 })
    })

    it("returns null when the BE emitted no track (nothing is invented)", () => {
        expect(readCareerPath([recommendation("CAREER_PATH", { track: null })])).toBeNull()
        expect(readCareerPath([])).toBeNull()
    })
})

describe("mapSubjectSkills", () => {
    const targets = readSkillTargets([
        recommendation("NEXT_SKILL", {
            items: [{ skillId: "s1", currentLevel: 2, targetLevel: 4, gap: 2 }],
        }),
    ])

    it("joins the subject's skill ids with the catalogue and the caller's level", () => {
        const rows = mapSubjectSkills(
            ["s1", "s3"],
            CATALOGUE,
            [progress("s1", 2), progress("s3", 1)],
            targets,
        )

        const java = rows.find((row) => row.id === "s1")
        expect(java).toMatchObject({
            name: "Java Core",
            category: "LANGUAGE",
            level: 2,
            maxLevel: 5,
            mastery: 40,
            targetLevel: 4,
            gap: 2,
        })
        // SQL: level 1 of its own 2-level ladder
        expect(rows.find((row) => row.id === "s3")).toMatchObject({
            name: "SQL",
            mastery: 50,
            targetLevel: null,
            gap: null,
        })
    })

    it("orders the least-mastered skill first (what to study next)", () => {
        const rows = mapSubjectSkills(
            ["s2", "s1", "s3"],
            CATALOGUE,
            [progress("s1", 2), progress("s3", 1)],
            targets,
        )

        // Spring Boot has no progress row → 0%, then Java (40%), then SQL (50%)
        expect(rows.map((row) => row.id)).toEqual(["s2", "s1", "s3"])
        expect(rows[0]).toMatchObject({ level: 0, mastery: 0 })
    })

    it("drops a skill the catalogue cannot name instead of inventing its ladder", () => {
        // a raw UUID as a name + maxLevelOf(undefined) = a hard-coded 5 would put a
        // fabricated denominator under a real-looking mastery bar
        const rows = mapSubjectSkills(["unknown-skill", "s1"], CATALOGUE, [], new Map())

        expect(rows.map((row) => row.id)).toEqual(["s1"])
    })

    it("renders nothing at all when the catalogue could not be read (guest 401)", () => {
        expect(mapSubjectSkills(["s1", "s2"], [], [progress("s1", 3)], new Map())).toEqual([])
    })

    it("keeps the eligible level so the 'ready to level up' hint can show", () => {
        const [row] = mapSubjectSkills(["s1"], CATALOGUE, [progress("s1", 1, 2)], new Map())

        expect(row.eligibleLevel).toBe(2)
    })

    it("renders nothing when the subject has no mapped skill", () => {
        expect(mapSubjectSkills([], CATALOGUE, [progress("s1", 3)], new Map())).toEqual([])
    })
})

describe("readRoadmapStepRefs", () => {
    it("accepts the snake_case row the BE JdbcTemplate serves", () => {
        expect(
            readRoadmapStepRefs({
                step_order: 1,
                skill_ids: ["s1", "s2"],
                subject_ids: ["sub-1"],
            }),
        ).toEqual({ skillIds: ["s1", "s2"], subjectIds: ["sub-1"] })
    })

    it("accepts the camelCase spelling declared by the FE type", () => {
        expect(readRoadmapStepRefs({ skillIds: ["s3"], subjectIds: [] })).toEqual({
            skillIds: ["s3"],
            subjectIds: [],
        })
    })

    it("degrades a junk row to empty lists", () => {
        expect(readRoadmapStepRefs(null)).toEqual({ skillIds: [], subjectIds: [] })
        expect(readRoadmapStepRefs({ skill_ids: "s1" })).toEqual({
            skillIds: [],
            subjectIds: [],
        })
    })
})

/** `{roadmap, steps}` as `GET /career/roadmaps/{slug}` returns it (snake_case steps). */
const detail = (steps: Array<unknown>): CareerRoadmapDetail =>
    ({ steps }) as unknown as CareerRoadmapDetail

describe("mapRoadmaps", () => {
    const roadmaps = [
        roadmap("r1", "backend", "Backend Developer", "BACKEND"),
        roadmap("r2", "frontend", "Frontend Developer", "FRONTEND"),
        roadmap("r3", "data", "Data Engineer", "DATA"),
    ]
    const names = new Map(CATALOGUE.map((entry) => [entry.id, entry.name]))
    const details = new Map<string, CareerRoadmapDetail>([
        ["backend", detail([{ step_order: 1, skill_ids: ["s1"], subject_ids: [] }])],
        ["frontend", detail([{ step_order: 1, skill_ids: ["s9"], subject_ids: [] }])],
        ["data", detail([{ step_order: 1, skill_ids: [], subject_ids: ["subject-1"] }])],
    ])

    it("flags a roadmap related when a step needs one of the subject's skills", () => {
        const rows = mapRoadmaps(roadmaps, details, ["s1"], "", new Set(), names)

        expect(rows.find((row) => row.slug === "backend")).toMatchObject({
            related: true,
            matchedSkillNames: ["Java Core"],
        })
        expect(rows.find((row) => row.slug === "frontend")?.related).toBe(false)
    })

    it("flags a roadmap related when a step points at the subject itself", () => {
        const rows = mapRoadmaps(roadmaps, details, [], "subject-1", new Set(), names)

        expect(rows.find((row) => row.slug === "data")).toMatchObject({
            related: true,
            matchedSkillNames: [],
        })
    })

    it("sorts related roadmaps first and keeps the rest as general suggestions", () => {
        const rows = mapRoadmaps(roadmaps, details, ["s1"], "", new Set(), names)

        expect(rows[0].slug).toBe("backend")
        expect(rows).toHaveLength(3)
    })

    it("marks the roadmaps the caller already follows", () => {
        const rows = mapRoadmaps(roadmaps, details, [], "", new Set(["r2"]), names)

        expect(rows.find((row) => row.id === "r2")?.enrolled).toBe(true)
        expect(rows.find((row) => row.id === "r1")?.enrolled).toBe(false)
    })

    it("claims no relation when the details could not be loaded", () => {
        const rows = mapRoadmaps(roadmaps, new Map(), ["s1"], "subject-1", new Set(), names)

        expect(rows.every((row) => !row.related)).toBe(true)
    })
})

describe("mapOpportunities", () => {
    const opportunities = [
        opportunity("o1", "Java Intern", "BACKEND", { type: "INTERNSHIP" }),
        opportunity("o2", "React Dev", "FRONTEND"),
        opportunity("o3", "No track", ""),
    ]

    it("flags the postings whose track comes from a subject-related roadmap", () => {
        const rows = mapOpportunities(opportunities, new Set(["BACKEND"]), new Set())

        expect(rows[0]).toMatchObject({ id: "o1", related: true })
        expect(rows.find((row) => row.id === "o2")?.related).toBe(false)
        // a blank track never counts as a match
        expect(rows.find((row) => row.id === "o3")?.related).toBe(false)
    })

    it("marks the postings the caller already applied to", () => {
        const rows = mapOpportunities(opportunities, new Set(), new Set(["o2"]))

        expect(rows.find((row) => row.id === "o2")?.applied).toBe(true)
        expect(rows.find((row) => row.id === "o1")?.applied).toBe(false)
    })

    it("renders nothing when the BE lists no open opportunity", () => {
        expect(mapOpportunities([], new Set(["BACKEND"]), new Set())).toEqual([])
    })
})

/** A rejection shaped like the `RestError` the REST client throws. */
const restError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status })

describe("sectionStatusOf", () => {
    it("tells the guest gate apart from a real failure", () => {
        expect(sectionStatusOf({ status: "fulfilled", value: [] })).toBe("loaded")
        expect(sectionStatusOf({ status: "rejected", reason: restError(401) })).toBe(
            "unauthorized",
        )
        expect(sectionStatusOf({ status: "rejected", reason: restError(403) })).toBe(
            "unauthorized",
        )
        expect(sectionStatusOf({ status: "rejected", reason: restError(500) })).toBe("failed")
        expect(sectionStatusOf({ status: "rejected", reason: new Error("network") })).toBe(
            "failed",
        )
    })
})

/** Workspace aggregate as the PUBLIC `GET /subjects/{code}/workspace` returns it. */
const workspace = (relatedSkills: Array<string>) =>
    ({
        overview: { id: "subject-1" },
        careerBridge: { available: true, data: { relatedSkills, nextSubjects: [] } },
    }) as unknown as WorkspaceView

describe("fetchSubjectCareer", () => {
    beforeEach(() => {
        vi.mocked(getSubjectWorkspace).mockResolvedValue(workspace(["s1"]))
        vi.mocked(getCareerSkills).mockResolvedValue({ skills: CATALOGUE } as never)
        vi.mocked(getMyCareerSkills).mockResolvedValue([])
        vi.mocked(getCareerRoadmaps).mockResolvedValue([])
        vi.mocked(getMyCareerRoadmaps).mockResolvedValue([])
        vi.mocked(getCareerOpportunities).mockResolvedValue([])
        vi.mocked(getMyCareerApplications).mockResolvedValue([])
        vi.mocked(getMyCareerRecommendations).mockResolvedValue([])
        vi.mocked(getCareerRoadmapDetail).mockResolvedValue(detail([]))
    })

    it("reports the 401 sections as unauthorized, not as empty (the page is public)", async () => {
        // every /career/** read is auth-gated while the workspace read is not
        vi.mocked(getCareerSkills).mockRejectedValue(restError(401))
        vi.mocked(getCareerRoadmaps).mockRejectedValue(restError(401))
        vi.mocked(getCareerOpportunities).mockRejectedValue(restError(401))

        const data = await fetchSubjectCareer("PRF192")

        expect(data.skillCatalogueStatus).toBe("unauthorized")
        expect(data.roadmapsStatus).toBe("unauthorized")
        expect(data.opportunitiesStatus).toBe("unauthorized")
        // the workspace still maps a skill — it just cannot be rendered honestly
        expect(data.skills).toEqual([])
        expect(data.unresolvedSkillCount).toBe(1)
    })

    it("flags a 5xx section as failed while the others still load", async () => {
        vi.mocked(getCareerOpportunities).mockRejectedValue(restError(500))

        const data = await fetchSubjectCareer("PRF192")

        expect(data.opportunitiesStatus).toBe("failed")
        expect(data.skillCatalogueStatus).toBe("loaded")
        expect(data.roadmapsStatus).toBe("loaded")
    })

    it("counts how many roadmaps were really checked, deterministically", async () => {
        // more published roadmaps than the detail fan-out allows
        const many = Array.from({ length: 30 }, (_, index) =>
            roadmap(`r${index}`, `slug-${String(index).padStart(2, "0")}`, `R${index}`, "BACKEND"),
        )
        vi.mocked(getCareerRoadmaps).mockResolvedValue(many)

        const data = await fetchSubjectCareer("PRF192")

        expect(data.roadmapsTotal).toBe(30)
        // bounded fan-out → the tail is UNKNOWN, so the tab must not claim it is unrelated
        expect(data.roadmapsChecked).toBeLessThan(data.roadmapsTotal)
        expect(data.hasRelatedRoadmaps).toBe(false)
        // the checked slice is the sorted head, never a nondeterministic BE order
        const checked = vi
            .mocked(getCareerRoadmapDetail)
            .mock.calls.map(([slug]) => slug)
        expect(checked).toEqual([...checked].sort())
        expect(checked[0]).toBe("slug-00")
    })

    it("reports a complete check when every roadmap detail was read", async () => {
        vi.mocked(getCareerRoadmaps).mockResolvedValue([
            roadmap("r1", "backend", "Backend Developer", "BACKEND"),
        ])
        vi.mocked(getCareerRoadmapDetail).mockResolvedValue(
            detail([{ step_order: 1, skill_ids: ["s1"], subject_ids: [] }]),
        )

        const data = await fetchSubjectCareer("PRF192")

        expect(data.roadmapsChecked).toBe(1)
        expect(data.roadmapsTotal).toBe(1)
        expect(data.hasRelatedRoadmaps).toBe(true)
    })
})
