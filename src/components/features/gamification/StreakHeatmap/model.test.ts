import { afterEach, describe, expect, it, vi } from "vitest"
import {
    buildHeatmapCells,
    HEATMAP_WEEKS,
    shiftIso,
    vnTodayIso,
    xpLevel,
    type HeatmapCell,
} from "./model"

/**
 * Unit — the pure streak-heatmap model (`buildHeatmapCells`, `xpLevel`,
 * `vnTodayIso`, `shiftIso`) that backs the streak popover + profile heatmap.
 * Pins the three things the spec (task 3.4) cares about:
 *  - the window fills to exactly `weeks × 7` dense, ordered cells (sparse backend
 *    rows land on their date; absent dates default to xp 0),
 *  - the XP intensity tiers (0 / 1–19 / 20–49 / 50+),
 *  - "today" tracks the Vietnam calendar day (UTC+7), not the runner's timezone.
 */

afterEach(() => {
    vi.useRealTimers()
})

describe("xpLevel", () => {
    it("buckets XP into four fixed intensity tiers", () => {
        expect(xpLevel(0)).toBe(0)
        expect(xpLevel(-5)).toBe(0)
        expect(xpLevel(1)).toBe(1)
        expect(xpLevel(19)).toBe(1)
        expect(xpLevel(20)).toBe(2)
        expect(xpLevel(49)).toBe(2)
        expect(xpLevel(50)).toBe(3)
        expect(xpLevel(9999)).toBe(3)
    })
})

describe("shiftIso", () => {
    it("moves a date backward/forward without day drift", () => {
        expect(shiftIso("2026-07-16", -1)).toBe("2026-07-15")
        expect(shiftIso("2026-07-16", 1)).toBe("2026-07-17")
        expect(shiftIso("2026-03-01", -1)).toBe("2026-02-28")
        expect(shiftIso("2026-01-01", -1)).toBe("2025-12-31")
    })
})

describe("vnTodayIso", () => {
    it("returns the Vietnam calendar day even when UTC has already rolled over", () => {
        // 2026-07-16 22:30 UTC is 2026-07-17 05:30 in Vietnam (UTC+7).
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-07-16T22:30:00Z"))
        expect(vnTodayIso()).toBe("2026-07-17")
    })

    it("still reads the Vietnam day when UTC is a day behind", () => {
        // 2026-07-16 01:00 UTC is 2026-07-16 08:00 in Vietnam — same date here.
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-07-16T01:00:00Z"))
        expect(vnTodayIso()).toBe("2026-07-16")
    })
})

describe("buildHeatmapCells", () => {
    it("fills exactly weeks × 7 dense cells, oldest → newest, ending today (VN)", () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-07-16T03:00:00Z")) // VN: 2026-07-16
        const cells = buildHeatmapCells([], HEATMAP_WEEKS)
        expect(cells).toHaveLength(HEATMAP_WEEKS * 7)
        expect(cells[cells.length - 1].date).toBe("2026-07-16")
        expect(cells[0].date).toBe(shiftIso("2026-07-16", -(HEATMAP_WEEKS * 7 - 1)))
        // strictly ascending dates
        for (let i = 1; i < cells.length; i += 1) {
            expect(cells[i].date > cells[i - 1].date).toBe(true)
        }
    })

    it("lands sparse backend rows on their date and defaults the rest to xp 0", () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-07-16T03:00:00Z"))
        const days: Array<HeatmapCell> = [
            { date: "2026-07-16", xp: 60 },
            { date: "2026-07-14", xp: 25 },
        ]
        const cells = buildHeatmapCells(days, 2)
        expect(cells).toHaveLength(14)
        const byDate = new Map(cells.map((cell) => [cell.date, cell.xp]))
        expect(byDate.get("2026-07-16")).toBe(60)
        expect(byDate.get("2026-07-14")).toBe(25)
        expect(byDate.get("2026-07-15")).toBe(0)
    })

    it("honours a custom window size", () => {
        const cells = buildHeatmapCells([], 4)
        expect(cells).toHaveLength(28)
    })

    it("ignores backend rows outside the window", () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-07-16T03:00:00Z"))
        const stale: Array<HeatmapCell> = [{ date: "2020-01-01", xp: 99 }]
        const cells = buildHeatmapCells(stale, 1)
        expect(cells.every((cell) => cell.xp === 0)).toBe(true)
    })
})
