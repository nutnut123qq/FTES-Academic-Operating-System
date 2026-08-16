import { describe, expect, it } from "vitest"
import {
    buildSkillExpChart,
    niceAxisMax,
    readSkillCategory,
    readSkillExp,
    readSkillExpPayload,
} from "./skillExpModel"

/** A catalogue row as `GET /career/skill-categories` serves it. */
const category = (slug: string, label: string, sortOrder: number) => ({ slug, label, sortOrder })

/** A learner row as the `items[]` of `GET /career/me/skill-exp` serves it. */
const total = (slug: string, totalExp: number) => ({ slug, label: slug, sortOrder: 0, totalExp })

/** The envelope the backend answers with since change `default-skills-by-major`. */
const skillSet = (
    items: Array<ReturnType<typeof total>>,
    meta: { majorCode?: string; majorLabel?: string } = {},
) => ({
    majorCode: meta.majorCode ?? null,
    majorLabel: meta.majorLabel ?? null,
    source: meta.majorCode ? "MAJOR_DEFAULTS" : "FULL_CATALOGUE",
    items,
})

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

describe("readSkillExpPayload", () => {
    it("reads the envelope shape", () => {
        const payload = readSkillExpPayload(
            skillSet([total("programming", 10)], { majorCode: "SE", majorLabel: "Kỹ Thuật Phần Mềm" }),
        )
        expect(payload.rows.map((row) => row.slug)).toEqual(["programming"])
        expect(payload.source).toBe("MAJOR_DEFAULTS")
        expect(payload.majorCode).toBe("SE")
        expect(payload.majorLabel).toBe("Kỹ Thuật Phần Mềm")
    })

    it("still reads the legacy bare array, so BE/FE deploy order cannot break the panel", () => {
        const payload = readSkillExpPayload([total("database", 40)])
        expect(payload.rows.map((row) => row.slug)).toEqual(["database"])
        // A payload with no major information reads as "we do not know" — which is what
        // the array shape meant — so the surface still prompts for a major.
        expect(payload.source).toBe("FULL_CATALOGUE")
        expect(payload.majorCode).toBeNull()
    })

    it("treats an unrecognised source as FULL_CATALOGUE (never suppresses the prompt)", () => {
        expect(readSkillExpPayload({ source: "SOMETHING_NEW", items: [] }).source).toBe("FULL_CATALOGUE")
        expect(readSkillExpPayload(null).source).toBe("FULL_CATALOGUE")
        expect(readSkillExpPayload(undefined).rows).toEqual([])
    })
})

describe("buildSkillExpChart", () => {
    it("ranks the learner's own skill set strongest first, zeros included", () => {
        const chart = buildSkillExpChart(
            CATALOGUE,
            skillSet([total("programming", 340), total("database", 150), total("testing", 0)], {
                majorCode: "SE",
            }),
        )

        expect(chart.bars.map((bar) => bar.slug)).toEqual(["programming", "database", "testing"])
        expect(chart.bars.map((bar) => bar.exp)).toEqual([340, 150, 0])
        expect(chart.peak).toBe(340)
        expect(chart.total).toBe(490)
        expect(chart.isEmpty).toBe(false)
        expect(chart.hasEarnedExp).toBe(true)
    })

    /** THE BUG THIS CHANGE FIXES: a brand-new learner used to get the empty state. */
    it("draws the major's skill set at zero instead of falling into the empty state", () => {
        const chart = buildSkillExpChart(
            CATALOGUE,
            skillSet([total("programming", 0), total("database", 0)], {
                majorCode: "SE",
                majorLabel: "Kỹ Thuật Phần Mềm",
            }),
        )

        expect(chart.bars.map((bar) => bar.slug)).toEqual(["programming", "database"])
        expect(chart.isEmpty).toBe(false)
        // ...but the surface still has to SAY nothing has been earned — that is a
        // different message from the axis hint, not a hidden chart.
        expect(chart.hasEarnedExp).toBe(false)
        expect(chart.axisMax).toBe(0)
        expect(chart.majorLabel).toBe("Kỹ Thuật Phần Mềm")
        expect(chart.source).toBe("MAJOR_DEFAULTS")
    })

    /** A Foreign-Languages learner must not get DevOps bars back from the catalogue. */
    it("does not widen the skill set back to the full catalogue", () => {
        const chart = buildSkillExpChart(CATALOGUE, skillSet([total("database", 0)], { majorCode: "LANG" }))
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["database"])
    })

    it("scales the axis to the learner's own peak, never to a fixed maximum", () => {
        expect(buildSkillExpChart(CATALOGUE, skillSet([total("programming", 340)])).axisMax).toBe(400)
        // Ten times the EXP → ten times the axis; the bars stay raw, nothing is normalised.
        expect(buildSkillExpChart(CATALOGUE, skillSet([total("programming", 3400)])).axisMax).toBe(4000)
    })

    /**
     * Ties keep the ORDER THE BACKEND SENT (the major's own order), not `sortOrder` —
     * which is the position in the global catalogue and disagrees on purpose.
     */
    it("breaks EXP ties on the backend's order, then label — stable across re-renders", () => {
        const chart = buildSkillExpChart(
            CATALOGUE,
            skillSet([total("testing", 0), total("database", 0), total("programming", 0)], {
                majorCode: "MATH",
            }),
        )
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["testing", "database", "programming"])
    })

    it("labels bars from the catalogue so an admin rename lands in one place", () => {
        const chart = buildSkillExpChart(CATALOGUE, skillSet([total("database", 0)]))
        expect(chart.bars[0]?.fallbackLabel).toBe("Database")
    })

    it("falls back to the catalogue when the learner read failed (guest / no permission)", () => {
        const chart = buildSkillExpChart(CATALOGUE, [])
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["programming", "database", "testing"])
        expect(chart.bars.every((bar) => bar.exp === 0)).toBe(true)
        expect(chart.isEmpty).toBe(false)
        expect(chart.source).toBe("FULL_CATALOGUE")
    })

    it("is empty ONLY when there is not a single bucket to draw", () => {
        const chart = buildSkillExpChart([], [])
        expect(chart.isEmpty).toBe(true)
        expect(chart.bars).toEqual([])
    })

    it("still draws when the catalogue read fails but the learner payload arrives", () => {
        const chart = buildSkillExpChart([], skillSet([
            { slug: "security", label: "An toàn thông tin", sortOrder: 90, totalExp: 20 },
            { slug: "devops", label: "DevOps", sortOrder: 80, totalExp: 80 },
        ], { majorCode: "SE" }))
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["devops", "security"])
        expect(chart.bars[0]?.fallbackLabel).toBe("DevOps")
        expect(chart.axisMax).toBe(80)
    })

    it("ignores malformed rows instead of throwing", () => {
        const chart = buildSkillExpChart(
            [...CATALOGUE, null, { label: "no slug" }],
            { source: "MAJOR_DEFAULTS", items: [total("programming", 100), "nope", { totalExp: 999 }] },
        )
        expect(chart.bars).toHaveLength(1)
        expect(chart.total).toBe(100)
    })
})
