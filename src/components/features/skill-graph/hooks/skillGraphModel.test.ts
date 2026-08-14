import { describe, expect, it } from "vitest"
import type { CareerSkill, CareerSkillProgress } from "@/modules/api/rest/career"
import {
    assignTiers,
    bestSourceOf,
    bucketOf,
    buildSkillGraph,
    domainForCategory,
    filterSkillsByQuery,
    groupSkillsByDomain,
    hasCourseMapping,
    masteryOf,
    maxLevelOf,
    nextUnlockOf,
    pendingPrerequisitesOf,
    readRelation,
    readSkillSources,
    scopeGraphToSkills,
    sortSkillsInGroup,
    statusOf,
    summarizeSkills,
    unlockLineOf,
    unlockProgressOf,
} from "./skillGraphModel"
import type { SkillGraphData, SkillNode } from "./skillGraphModel"

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

const LADDER_5 = "[{\"level\":1},{\"level\":2},{\"level\":3},{\"level\":4},{\"level\":5}]"
const LADDER_2 = "[{\"level\":1,\"threshold\":0},{\"level\":2,\"threshold\":100}]"

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

// ---------------------------------------------------------------------------
// Bảng kỹ năng theo nhóm nghề
// ---------------------------------------------------------------------------

/** Dựng nhanh một nút với chỉ những trường mà phép thử quan tâm. */
const node = (overrides: Partial<SkillNode> & Pick<SkillNode, "id" | "name">): SkillNode => ({
    domain: "be",
    level: 0,
    status: "locked",
    levelIndex: 0,
    maxLevel: 5,
    eligibleLevel: 0,
    unlocked: false,
    unlockPercent: null,
    sources: [],
    subjectIds: [],
    courseIds: [],
    ...overrides,
})

/** Một nguồn khoá học đầy đủ trường. */
const source = (id: string, completionPercent: number, requiredPercent: number | null = 80) => ({
    courseId: id,
    courseTitle: id.toUpperCase(),
    courseSlug: id,
    completionPercent,
    requiredPercent,
    weight: 1,
})

describe("readSkillSources", () => {
    it("đọc được cả camelCase lẫn snake_case và điền mặc định khi thiếu trường", () => {
        expect(
            readSkillSources([
                { courseId: "c1", courseTitle: "C Basic", courseSlug: "c-basic", completionPercent: 60, unlockAtPercent: 80, weight: 2 },
                { course_id: "c2", course_title: "Java", completion_percent: "40", required_percent: 50 },
                { courseId: "c3" },
            ]),
        ).toEqual([
            { courseId: "c1", courseTitle: "C Basic", courseSlug: "c-basic", completionPercent: 60, requiredPercent: 80, weight: 2 },
            { courseId: "c2", courseTitle: "Java", courseSlug: "c2", completionPercent: 40, requiredPercent: 50, weight: 0 },
            { courseId: "c3", courseTitle: "c3", courseSlug: "c3", completionPercent: 0, requiredPercent: null, weight: 0 },
        ])
    })

    it("trả [] khi BE chưa gửi trường này (hoặc gửi rác)", () => {
        expect(readSkillSources(undefined)).toEqual([])
        expect(readSkillSources(null)).toEqual([])
        expect(readSkillSources("nope")).toEqual([])
        expect(readSkillSources([null, 3, { noId: true }])).toEqual([])
    })
})

describe("buildSkillGraph — hợp đồng mở khoá đang được BE bổ sung", () => {
    const skills = [skill("s1", "Java Core", "LANGUAGE", LADDER_5)]

    it("chạy bình thường khi BE CHƯA trả unlocked/unlockPercent/sources", () => {
        const graph = buildSkillGraph(skills, [], [progress("s1", 2)])
        expect(graph.nodes[0]).toMatchObject({
            levelIndex: 2,
            maxLevel: 5,
            unlocked: true, // suy ra từ level > 0
            unlockPercent: null,
            sources: [],
        })
        expect(bucketOf(graph.nodes[0])).toBe("learning")
    })

    it("đọc các trường mới từ hàng tiến độ khi BE đã trả", () => {
        const row = {
            ...progress("s1", 0),
            unlocked: false,
            unlockPercent: 60,
            sources: [{ courseId: "c1", courseTitle: "C Basic", completionPercent: 60, requiredPercent: 80 }],
        } as unknown as CareerSkillProgress
        const graph = buildSkillGraph(skills, [], [row])
        expect(graph.nodes[0]).toMatchObject({ unlocked: false, unlockPercent: 60 })
        expect(graph.nodes[0].sources).toHaveLength(1)
        expect(bucketOf(graph.nodes[0])).toBe("nearly")
    })

    it("đọc được cả khi BE gắn các trường lên hàng CATALOGUE thay vì hàng tiến độ", () => {
        const catalogueSkill = {
            ...skill("s1", "Java Core", "LANGUAGE", LADDER_5),
            unlockPercent: 30,
            sources: [{ course_id: "c9", completion_percent: 30 }],
        } as unknown as CareerSkill
        const graph = buildSkillGraph([catalogueSkill], [], [])
        expect(graph.nodes[0].unlockPercent).toBe(30)
        expect(graph.nodes[0].sources[0].courseId).toBe("c9")
    })

    it("giữ eligibleLevel để UI báo 'đủ điều kiện lên bậc'", () => {
        const row = { ...progress("s1", 1), eligibleLevel: 3 }
        const graph = buildSkillGraph(skills, [], [row])
        expect(graph.nodes[0]).toMatchObject({ levelIndex: 1, eligibleLevel: 3 })
    })
})

describe("bucketOf", () => {
    it("thành thạo / đang học đọc từ bậc thang", () => {
        expect(bucketOf(node({ id: "a", name: "A", status: "mastered", level: 100 }))).toBe("mastered")
        expect(bucketOf(node({ id: "b", name: "B", status: "learning", level: 40 }))).toBe("learning")
    })

    it("BE nói unlocked=true thì là 'đang học' dù bậc còn 0", () => {
        expect(bucketOf(node({ id: "c", name: "C", unlocked: true }))).toBe("learning")
    })

    it("'sắp mở' CHẶT: chưa mở nhưng đã có tiến độ đo được", () => {
        expect(bucketOf(node({ id: "d", name: "D", unlockPercent: 60 }))).toBe("nearly")
        expect(bucketOf(node({ id: "e", name: "E", sources: [source("c1", 25)] }))).toBe("nearly")
    })

    it("không có dữ liệu khoá thì KHÔNG bao giờ là 'sắp mở'", () => {
        expect(bucketOf(node({ id: "f", name: "F" }))).toBe("locked")
        expect(bucketOf(node({ id: "g", name: "G", unlockPercent: 0, sources: [source("c1", 0)] }))).toBe("locked")
    })
})

describe("unlockProgressOf / bestSourceOf / unlockLineOf", () => {
    it("ưu tiên unlockPercent của BE, nếu không thì lấy khoá đi xa nhất", () => {
        expect(unlockProgressOf(node({ id: "a", name: "A", unlockPercent: 70, sources: [source("c1", 10)] }))).toBe(70)
        expect(unlockProgressOf(node({ id: "b", name: "B", sources: [source("c1", 10), source("c2", 45)] }))).toBe(45)
        expect(unlockProgressOf(node({ id: "c", name: "C" }))).toBe(0)
    })

    it("hoà % thì lấy khoá có trọng số lớn hơn", () => {
        const heavy = { ...source("c2", 50), weight: 9 }
        expect(bestSourceOf(node({ id: "d", name: "D", sources: [source("c1", 50), heavy] }))?.courseId).toBe("c2")
    })

    it("chưa gắn khoá nào → kind 'none' (thực trạng BE hôm nay)", () => {
        expect(unlockLineOf(node({ id: "e", name: "E" }))).toEqual({ kind: "none" })
    })

    it("đã mở → 'already'; chưa mở → 'progress' kèm số khoá còn lại", () => {
        const opened = node({ id: "f", name: "F", status: "learning", unlocked: true, sources: [source("c1", 100)] })
        expect(unlockLineOf(opened)).toMatchObject({ kind: "already", extra: 0 })

        const pending = node({ id: "g", name: "G", sources: [source("c1", 60), source("c2", 10), source("c3", 5)] })
        expect(unlockLineOf(pending)).toMatchObject({ kind: "progress", percent: 60, extra: 2 })
    })
})

describe("assignTiers", () => {
    const nodes = ["a", "b", "c", "d"].map((id) => node({ id, name: id.toUpperCase() }))
    const edge = (source_: string, target: string) => ({
        id: `pre-${source_}-${target}`,
        source: source_,
        target,
        kind: "prerequisite" as const,
    })

    it("không cạnh → mọi thứ bậc 0 (no-op vô hại, đúng hiện trạng dữ liệu)", () => {
        const tiers = assignTiers(nodes, [])
        expect([...tiers.values()]).toEqual([0, 0, 0, 0])
    })

    it("chuỗi thẳng a→b→c cho bậc tăng dần", () => {
        const tiers = assignTiers(nodes, [edge("a", "b"), edge("b", "c")])
        expect(tiers.get("a")).toBe(0)
        expect(tiers.get("b")).toBe(1)
        expect(tiers.get("c")).toBe(2)
    })

    it("hình thoi lấy đường DÀI nhất", () => {
        const tiers = assignTiers(nodes, [edge("a", "b"), edge("a", "c"), edge("b", "d"), edge("c", "d")])
        expect(tiers.get("d")).toBe(2)
    })

    it("CHU TRÌNH không treo vòng lặp (BE chỉ chặn cycle cho REQUIRES)", () => {
        const tiers = assignTiers(nodes, [edge("a", "b"), edge("b", "a")])
        expect(tiers.get("a")).toBe(0)
        expect(tiers.get("b")).toBe(0)
        expect(tiers.get("c")).toBe(0)
    })

    it("bỏ qua cạnh 'related' và cạnh trỏ ra ngoài tập nút", () => {
        const tiers = assignTiers(nodes, [
            { id: "rel", source: "a", target: "b", kind: "related" },
            edge("a", "zz"),
        ])
        expect(tiers.get("b")).toBe(0)
    })
})

describe("sortSkillsInGroup", () => {
    it("đẩy việc nên làm tiếp lên đầu: đang học → sắp mở → thành thạo → chưa mở", () => {
        const nodes = [
            node({ id: "locked", name: "Locked" }),
            node({ id: "mastered", name: "Mastered", status: "mastered", level: 100 }),
            node({ id: "nearly", name: "Nearly", unlockPercent: 50 }),
            node({ id: "learning", name: "Learning", status: "learning", level: 40 }),
        ]
        expect(sortSkillsInGroup(nodes, new Map()).map((item) => item.id)).toEqual([
            "learning",
            "nearly",
            "mastered",
            "locked",
        ])
    })

    it("trong cùng bucket: bậc tăng dần → % giảm dần → tên (vi)", () => {
        const nodes = [
            node({ id: "b", name: "Ánh", status: "learning", level: 30 }),
            node({ id: "a", name: "Ẩn", status: "learning", level: 30 }),
            node({ id: "c", name: "Cao", status: "learning", level: 90 }),
        ]
        const tiers = new Map([["c", 1], ["a", 0], ["b", 0]])
        expect(sortSkillsInGroup(nodes, tiers).map((item) => item.id)).toEqual(["b", "a", "c"])
    })

    it("không đụng mảng gốc", () => {
        const nodes = [node({ id: "x", name: "X" }), node({ id: "y", name: "Y", status: "learning", level: 1 })]
        const before = nodes.map((item) => item.id)
        sortSkillsInGroup(nodes, new Map())
        expect(nodes.map((item) => item.id)).toEqual(before)
    })
})

describe("groupSkillsByDomain / summarizeSkills", () => {
    const graph: SkillGraphData = {
        nodes: [
            node({ id: "s1", name: "Java", domain: "be", status: "mastered", level: 100 }),
            node({ id: "s2", name: "Spring", domain: "be", status: "learning", level: 40 }),
            node({ id: "s3", name: "React", domain: "fe" }),
            node({ id: "s4", name: "Kafka", domain: "data", unlockPercent: 20 }),
        ],
        edges: [],
    }

    it("giữ thứ tự nhóm cố định và bỏ nhóm rỗng", () => {
        expect(groupSkillsByDomain(graph).map((group) => group.domain)).toEqual(["be", "fe", "data"])
    })

    it("đếm số kỹ năng đã mở của từng nhóm", () => {
        const [be, fe] = groupSkillsByDomain(graph)
        expect(be.unlockedCount).toBe(2)
        expect(fe.unlockedCount).toBe(0)
    })

    it("tóm tắt đếm đủ bốn bucket", () => {
        expect(summarizeSkills(graph.nodes)).toEqual({
            total: 4,
            mastered: 1,
            learning: 1,
            nearly: 1,
            locked: 1,
        })
    })
})

describe("pendingPrerequisitesOf", () => {
    const graph: SkillGraphData = {
        nodes: [
            node({ id: "base", name: "Java cơ bản" }),
            node({ id: "done", name: "Git", status: "mastered", level: 100 }),
            node({ id: "target", name: "Spring" }),
        ],
        edges: [
            { id: "e1", source: "base", target: "target", kind: "prerequisite" },
            { id: "e2", source: "done", target: "target", kind: "prerequisite" },
            { id: "e3", source: "done", target: "target", kind: "related" },
        ],
    }

    it("chỉ nêu tiên quyết CHƯA đạt, bỏ qua quan hệ 'related'", () => {
        expect(pendingPrerequisitesOf(graph, "target")).toEqual(["Java cơ bản"])
    })

    it("im lặng khi không có cạnh nào (hiện trạng skill_relations rỗng)", () => {
        expect(pendingPrerequisitesOf({ nodes: graph.nodes, edges: [] }, "target")).toEqual([])
    })
})

describe("nextUnlockOf / hasCourseMapping", () => {
    it("chọn kỹ năng sắp mở còn thiếu ÍT nhất", () => {
        const nodes = [
            node({ id: "a", name: "A", sources: [source("c1", 60, 80)] }),
            node({ id: "b", name: "B", sources: [source("c2", 30, 80)] }),
        ]
        expect(nextUnlockOf(nodes)).toMatchObject({ remaining: 20 })
    })

    it("trả null khi chưa có dữ liệu khoá — dải tóm tắt phải ẩn nút", () => {
        expect(nextUnlockOf([node({ id: "a", name: "A" })])).toBeNull()
        expect(nextUnlockOf([node({ id: "b", name: "B", unlockPercent: 40 })])).toBeNull()
    })

    it("hasCourseMapping phát hiện trạng thái 'chưa khoá nào khai báo kỹ năng'", () => {
        expect(hasCourseMapping([node({ id: "a", name: "A" })])).toBe(false)
        expect(hasCourseMapping([node({ id: "a", name: "A", sources: [source("c1", 0)] })])).toBe(true)
    })
})

describe("filterSkillsByQuery", () => {
    const nodes = [node({ id: "a", name: "Spring Boot" }), node({ id: "b", name: "React" })]

    it("lọc không phân biệt hoa thường", () => {
        expect(filterSkillsByQuery(nodes, "spring").map((item) => item.id)).toEqual(["a"])
    })

    it("query rỗng trả nguyên danh sách", () => {
        expect(filterSkillsByQuery(nodes, "   ")).toBe(nodes)
    })
})
