import { describe, expect, it } from "vitest"
import {
    buildEloChart,
    niceAxisMax,
    readSkillCategory,
    readEloRow,
    readEloPayload,
    eloSetNotice,
} from "./eloModel"

/** A catalogue row as `GET /career/skill-categories` serves it. */
const category = (slug: string, label: string, sortOrder: number) => ({ slug, label, sortOrder })

/** A learner row as the `items[]` of `GET /career/me/elo` serves it. */
const total = (slug: string, totalElo: number) => ({ slug, label: slug, sortOrder: 0, totalElo })

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

describe("readSkillCategory / readEloRow", () => {
    it("reads snake_case as well as camelCase", () => {
        expect(readSkillCategory({ slug: "devops", label: "DevOps", sort_order: 8 })).toEqual({
            slug: "devops",
            label: "DevOps",
            sortOrder: 8,
        })
        // `total_elo` is a bigint column — a stringified total must still add up.
        expect(readEloRow({ slug: "devops", total_elo: "120" })).toEqual({
            slug: "devops",
            label: undefined,
            sortOrder: undefined,
            totalElo: 120,
        })
    })

    it("drops rows with no slug and clamps a negative total", () => {
        expect(readSkillCategory({ label: "DevOps" })).toBeNull()
        expect(readSkillCategory(null)).toBeNull()
        expect(readEloRow("nope")).toBeNull()
        expect(readEloRow({ slug: "testing", totalElo: -40 })?.totalElo).toBe(0)
    })

    /**
     * CÁI NÀY LÀ NỬA CÒN LẠI CỦA ĐƯỜNG LÙI, và thiếu nó thì đường lùi kia vô nghĩa.
     *
     * `getMyCareerElo` gặp 404 sẽ gọi alias cũ `/career/me/skill-exp` — alias đó trả hình dạng CŨ
     * (`totalExp`). Nếu chỗ này chỉ đọc `totalElo` thì lời gọi lùi vẫn "thành công" nhưng mọi cột
     * về 0: học viên đang có 250 Elo nhìn thấy một biểu đồ trắng mà KHÔNG có lỗi nào để mà thấy.
     * Đó là kiểu hỏng tệ nhất — im lặng và trông y như dữ liệu thật.
     */
    it("đọc được CẢ hình dạng trước-đổi-tên (totalExp) mà alias cũ trả về", () => {
        expect(readEloRow({ slug: "programming", totalExp: 250 })?.totalElo).toBe(250)
        expect(readEloRow({ slug: "programming", total_exp: "250" })?.totalElo).toBe(250)
        // Hình dạng MỚI vẫn thắng khi có cả hai (bản BE mới, không lẫn lộn).
        expect(readEloRow({ slug: "programming", totalElo: 9, totalExp: 250 })?.totalElo).toBe(9)
    })
})

describe("readEloPayload", () => {
    it("reads the envelope shape", () => {
        const payload = readEloPayload(
            skillSet([total("programming", 10)], { majorCode: "SE", majorLabel: "Kỹ Thuật Phần Mềm" }),
        )
        expect(payload.rows.map((row) => row.slug)).toEqual(["programming"])
        expect(payload.source).toBe("MAJOR_DEFAULTS")
        expect(payload.majorCode).toBe("SE")
        expect(payload.majorLabel).toBe("Kỹ Thuật Phần Mềm")
    })

    it("still reads the legacy bare array, so BE/FE deploy order cannot break the panel", () => {
        const payload = readEloPayload([total("database", 40)])
        expect(payload.rows.map((row) => row.slug)).toEqual(["database"])
        // A payload with no major information reads as "we do not know" — which is what
        // the array shape meant — so the surface still prompts for a major.
        expect(payload.source).toBe("FULL_CATALOGUE")
        expect(payload.majorCode).toBeNull()
    })

    it("treats an unrecognised source as FULL_CATALOGUE (never suppresses the prompt)", () => {
        expect(readEloPayload({ source: "SOMETHING_NEW", items: [] }).source).toBe("FULL_CATALOGUE")
        expect(readEloPayload(null).source).toBe("FULL_CATALOGUE")
        expect(readEloPayload(undefined).rows).toEqual([])
    })
})

describe("buildEloChart", () => {
    it("ranks the learner's own skill set strongest first, zeros included", () => {
        const chart = buildEloChart(
            CATALOGUE,
            skillSet([total("programming", 340), total("database", 150), total("testing", 0)], {
                majorCode: "SE",
            }),
        )

        expect(chart.bars.map((bar) => bar.slug)).toEqual(["programming", "database", "testing"])
        expect(chart.bars.map((bar) => bar.elo)).toEqual([340, 150, 0])
        expect(chart.peak).toBe(340)
        expect(chart.total).toBe(490)
        expect(chart.isEmpty).toBe(false)
        expect(chart.hasEarnedElo).toBe(true)
    })

    /** THE BUG THIS CHANGE FIXES: a brand-new learner used to get the empty state. */
    it("draws the major's skill set at zero instead of falling into the empty state", () => {
        const chart = buildEloChart(
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
        expect(chart.hasEarnedElo).toBe(false)
        expect(chart.axisMax).toBe(0)
        expect(chart.majorLabel).toBe("Kỹ Thuật Phần Mềm")
        expect(chart.source).toBe("MAJOR_DEFAULTS")
    })

    /** A Foreign-Languages learner must not get DevOps bars back from the catalogue. */
    it("does not widen the skill set back to the full catalogue", () => {
        const chart = buildEloChart(CATALOGUE, skillSet([total("database", 0)], { majorCode: "LANG" }))
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["database"])
    })

    it("scales the axis to the learner's own peak, never to a fixed maximum", () => {
        expect(buildEloChart(CATALOGUE, skillSet([total("programming", 340)])).axisMax).toBe(400)
        // Ten times the Elo → ten times the axis; the bars stay raw, nothing is normalised.
        expect(buildEloChart(CATALOGUE, skillSet([total("programming", 3400)])).axisMax).toBe(4000)
    })

    /**
     * Ties keep the ORDER THE BACKEND SENT (the major's own order), not `sortOrder` —
     * which is the position in the global catalogue and disagrees on purpose.
     */
    it("breaks Elo ties on the backend's order, then label — stable across re-renders", () => {
        const chart = buildEloChart(
            CATALOGUE,
            skillSet([total("testing", 0), total("database", 0), total("programming", 0)], {
                majorCode: "MATH",
            }),
        )
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["testing", "database", "programming"])
    })

    it("labels bars from the catalogue so an admin rename lands in one place", () => {
        const chart = buildEloChart(CATALOGUE, skillSet([total("database", 0)]))
        expect(chart.bars[0]?.fallbackLabel).toBe("Database")
    })

    it("falls back to the catalogue when the learner read failed (guest / no permission)", () => {
        const chart = buildEloChart(CATALOGUE, [], true)
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["programming", "database", "testing"])
        expect(chart.bars.every((bar) => bar.elo === 0)).toBe(true)
        expect(chart.isEmpty).toBe(false)
        expect(chart.source).toBe("FULL_CATALOGUE")
        // ...và PHẢI mang cờ nói rằng đây là danh mục thay thế, không phải Elo đã đọc được.
        expect(chart.learnerReadUnavailable).toBe(true)
    })

    /**
     * "Đọc được và rỗng" KHÁC "không đọc được" — gộp hai cái này chính là lớp bug đang chữa.
     * Payload rỗng ĐỌC ĐƯỢC (học viên chưa học gì, BE cũ trả mảng trần) tuyệt đối không được
     * mang cờ hỏng, nếu không màn hình sẽ đi bảo người dùng là hệ thống chưa đọc được Elo.
     */
    it("keeps an EMPTY-but-read payload apart from an UNREADABLE one", () => {
        expect(buildEloChart(CATALOGUE, []).learnerReadUnavailable).toBe(false)
        expect(buildEloChart(CATALOGUE, skillSet([])).learnerReadUnavailable).toBe(false)
        expect(buildEloChart(CATALOGUE, [], true).learnerReadUnavailable).toBe(true)
    })

    it("is empty ONLY when there is not a single bucket to draw", () => {
        const chart = buildEloChart([], [])
        expect(chart.isEmpty).toBe(true)
        expect(chart.bars).toEqual([])
    })

    it("still draws when the catalogue read fails but the learner payload arrives", () => {
        const chart = buildEloChart([], skillSet([
            { slug: "security", label: "An toàn thông tin", sortOrder: 90, totalElo: 20 },
            { slug: "devops", label: "DevOps", sortOrder: 80, totalElo: 80 },
        ], { majorCode: "SE" }))
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["devops", "security"])
        expect(chart.bars[0]?.fallbackLabel).toBe("DevOps")
        expect(chart.axisMax).toBe(80)
    })

    it("carries the major code even when the skill set fell back to the catalogue", () => {
        // BE trả kèm majorCode ngay cả khi source=FULL_CATALOGUE (ngành chưa khai bộ mặc định) —
        // đó là thứ duy nhất tách được "chưa chọn ngành" khỏi "ngành chưa có bộ".
        const chart = buildEloChart(CATALOGUE, {
            majorCode: "AI",
            majorLabel: "Trí tuệ nhân tạo",
            source: "FULL_CATALOGUE",
            items: [],
        })
        expect(chart.source).toBe("FULL_CATALOGUE")
        expect(chart.majorCode).toBe("AI")
        expect(chart.majorLabel).toBe("Trí tuệ nhân tạo")
    })

    it("ignores malformed rows instead of throwing", () => {
        const chart = buildEloChart(
            [...CATALOGUE, null, { label: "no slug" }],
            { source: "MAJOR_DEFAULTS", items: [total("programming", 100), "nope", { totalElo: 999 }] },
        )
        expect(chart.bars).toHaveLength(1)
        expect(chart.total).toBe(100)
    })
})

/**
 * Câu in dưới các cột. Đây là chỗ đã nói SAI: màn hình chỉ nhìn `source === "FULL_CATALOGUE"` rồi
 * kết luận "chưa rõ ngành của bạn", trong khi BE cố tình gộp hai tình huống khác hẳn nhau vào cùng
 * một `source` và trả `majorCode` kèm theo để tách chúng ra.
 */
describe("eloSetNotice", () => {
    const chartOf = (totals: unknown, learnerReadUnavailable = false) =>
        buildEloChart(CATALOGUE, totals, learnerReadUnavailable)

    it("mời chọn ngành CHỈ khi thật sự chưa chọn ngành", () => {
        expect(eloSetNotice(chartOf(skillSet([total("database", 0)])))).toBe("NO_MAJOR")
        // Bản BE cũ (mảng trần, không có tin gì về ngành) cũng là "chưa biết ngành".
        expect(eloSetNotice(chartOf([total("database", 0)]))).toBe("NO_MAJOR")
    })

    /**
     * NHÁNH THỨ BA trước đây không có tiếng nói nào: admin thêm ngành mới qua CMS ngành bên
     * Workspace, nhưng `career.major_skill_categories` chỉ được seed bằng migration ⇒ ngành mới
     * KHÔNG BAO GIỜ có bộ mặc định. Học viên ngành đó nhận majorCode + source=FULL_CATALOGUE.
     * Nói với họ "chưa rõ ngành của bạn" rồi mời sang /profile/edit là nói sai về hồ sơ của họ và
     * gửi họ tới một form không có gì để sửa.
     */
    it("KHÔNG mời chọn lại khi đã có ngành mà ngành đó chưa khai bộ kỹ năng", () => {
        const chart = chartOf({
            majorCode: "AI",
            majorLabel: "Trí tuệ nhân tạo",
            source: "FULL_CATALOGUE",
            items: [],
        })
        expect(eloSetNotice(chart)).toBe("MAJOR_WITHOUT_SET")
    })

    it("nói đúng khi bộ cột là của ngành, và im lặng khi thiếu nhãn ngành", () => {
        expect(
            eloSetNotice(chartOf(skillSet([total("database", 10)], {
                majorCode: "SE",
                majorLabel: "Kỹ Thuật Phần Mềm",
            }))),
        ).toBe("MAJOR_SET")
        // Danh mục ngành (service khác) không với tới được ⇒ không nhãn ⇒ đừng in mã trần.
        expect(eloSetNotice(chartOf({
            majorCode: "SE",
            majorLabel: null,
            source: "MAJOR_DEFAULTS",
            items: [total("database", 10)],
        }))).toBe("NONE")
    })

    /** Không đọc được Elo thì mọi câu khác đều là suy đoán — kể cả lời mời chọn ngành. */
    it("nói 'chưa đọc được' thay vì mời chọn ngành khi đường đọc học viên hỏng", () => {
        expect(eloSetNotice(chartOf([], true))).toBe("READ_UNAVAILABLE")
    })
})
