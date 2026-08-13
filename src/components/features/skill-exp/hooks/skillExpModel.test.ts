import { describe, expect, it } from "vitest"
import { buildSkillExpChart, niceAxisMax, readSkillCategory, readSkillExp } from "./skillExpModel"

/** A catalogue row as `GET /career/skill-categories` serves it. */
const category = (slug: string, label: string, sortOrder: number) => ({ slug, label, sortOrder })

/** A learner total as `GET /career/me/skill-exp` serves it. */
const total = (slug: string, totalExp: number) => ({ slug, label: slug, sortOrder: 0, totalExp })

const CATALOGUE = [
    category("programming", "Programming", 1),
    category("database", "Database", 2),
    category("testing", "Testing", 3),
]

describe("niceAxisMax", () => {
    it("rounds the peak UP to a readable step × 10ⁿ", () => {
        expect(niceAxisMax(340)).toBe(400)
        expect(niceAxisMax(120)).toBe(150)
        expect(niceAxisMax(210)).toBe(250)
        expect(niceAxisMax(80)).toBe(80)
        expect(niceAxisMax(1)).toBe(1)
        expect(niceAxisMax(1000)).toBe(1000)
        expect(niceAxisMax(1001)).toBe(1500)
    })

    it("keeps the strongest bar filling most of the track (no wasteful axis)", () => {
        for (const peak of [1, 7, 13, 99, 101, 251, 999, 4321, 87654]) {
            expect(niceAxisMax(peak)).toBeLessThanOrEqual(peak * 1.5)
        }
    })

    it("never returns an axis below the peak (the top bar always fits)", () => {
        for (const peak of [1, 7, 13, 99, 100, 101, 249, 251, 999, 4321, 87654]) {
            expect(niceAxisMax(peak)).toBeGreaterThanOrEqual(peak)
        }
    })

    it("has no axis to draw when nothing has been earned", () => {
        expect(niceAxisMax(0)).toBe(0)
        expect(niceAxisMax(-5)).toBe(0)
        expect(niceAxisMax(Number.NaN)).toBe(0)
    })
})

describe("readSkillCategory / readSkillExp", () => {
    it("reads snake_case as well as camelCase", () => {
        expect(readSkillCategory({ slug: "devops", label: "DevOps", sort_order: 8 })).toEqual({
            slug: "devops",
            label: "DevOps",
            sortOrder: 8,
        })
        // `total_exp` is a bigint column — a stringified total must still add up.
        expect(readSkillExp({ slug: "devops", total_exp: "120" })).toEqual({
            slug: "devops",
            label: undefined,
            sortOrder: undefined,
            totalExp: 120,
        })
    })

    it("drops rows with no slug and clamps a negative total", () => {
        expect(readSkillCategory({ label: "DevOps" })).toBeNull()
        expect(readSkillCategory(null)).toBeNull()
        expect(readSkillExp("nope")).toBeNull()
        expect(readSkillExp({ slug: "testing", totalExp: -40 })?.totalExp).toBe(0)
    })
})

describe("buildSkillExpChart", () => {
    it("keeps every category — including the ones still at zero — ranked strongest first", () => {
        const chart = buildSkillExpChart(CATALOGUE, [total("database", 150), total("programming", 340)])

        expect(chart.bars.map((bar) => bar.slug)).toEqual(["programming", "database", "testing"])
        expect(chart.bars.map((bar) => bar.exp)).toEqual([340, 150, 0])
        expect(chart.peak).toBe(340)
        expect(chart.total).toBe(490)
        expect(chart.isEmpty).toBe(false)
    })

    it("scales the axis to the learner's own peak, never to a fixed maximum", () => {
        expect(buildSkillExpChart(CATALOGUE, [total("programming", 340)]).axisMax).toBe(400)
        // Ten times the EXP → ten times the axis; the bars stay raw, nothing is normalised.
        expect(buildSkillExpChart(CATALOGUE, [total("programming", 3400)]).axisMax).toBe(4000)
    })

    it("breaks EXP ties on catalogue order, then label — stable across re-renders", () => {
        const chart = buildSkillExpChart(CATALOGUE, [total("testing", 50), total("database", 50)])
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["database", "testing", "programming"])
    })

    it("keeps the catalogue's own position when the backend sends no sort order", () => {
        const unordered = [
            { id: "c1", slug: "testing", label: "Testing" },
            { id: "c2", slug: "database", label: "Database" },
        ]
        const chart = buildSkillExpChart(unordered, [total("testing", 50), total("database", 50)])
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["testing", "database"])
    })

    it("flags a learner with no EXP as empty rather than drawing flat bars", () => {
        const chart = buildSkillExpChart(CATALOGUE, [])
        expect(chart.bars).toHaveLength(3)
        expect(chart.peak).toBe(0)
        expect(chart.axisMax).toBe(0)
        expect(chart.isEmpty).toBe(true)
    })

    it("is empty when the catalogue and the totals are both unavailable", () => {
        expect(buildSkillExpChart([], []).isEmpty).toBe(true)
        expect(buildSkillExpChart([], []).bars).toEqual([])
    })

    it("falls back to the totals payload when the catalogue read fails", () => {
        const chart = buildSkillExpChart([], [
            { slug: "security", label: "An toàn thông tin", sortOrder: 90, totalExp: 20 },
            { slug: "devops", label: "DevOps", sortOrder: 80, totalExp: 80 },
        ])
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["devops", "security"])
        expect(chart.bars[0]?.fallbackLabel).toBe("DevOps")
        expect(chart.axisMax).toBe(80)
    })

    it("ignores malformed rows instead of throwing", () => {
        const chart = buildSkillExpChart(
            [...CATALOGUE, null, { label: "no slug" }],
            [total("programming", 100), "nope", { totalExp: 999 }],
        )
        expect(chart.bars).toHaveLength(3)
        expect(chart.total).toBe(100)
    })
})
