import { describe, expect, it } from "vitest"
import type { StudyPlanView } from "@/modules/api/rest/ai"
import {
    applyProgress,
    buildTaskKey,
    computePercentDone,
    isTaskDone,
    planTaskKeys,
} from "./logic"

/**
 * Unit — the pure planner check-off logic (`ai-hub-live-tools` task 5.4). The
 * fixture mirrors the BE seed V250 demo plan (2 weeks × 3 tasks = 6 task keys,
 * `w1:0` done ⇒ 17%), so every assertion here pins the FE mirror of the BE
 * `validTaskKeys` / `computePercentDone` contract:
 *  - task keys are `w{week}:{index}` in document order,
 *  - malformed weeks are skipped (client stays in sync with the server count),
 *  - stale/out-of-range done keys never count toward the percentage,
 *  - `applyProgress` is optimistic-update-safe: pure (rollback keeps the old
 *    view intact), dedupe-safe (idempotent double check), and recomputes
 *    `percentDone` exactly like the BE.
 */

const task = (title: string) => ({ title, est_hours: 2, resource_hint: null })

/** Mirrors the seed V250 demo plan: 2 weeks × 3 tasks, `w1:0` checked ⇒ 17%. */
const seedView = (): StudyPlanView => ({
    id: "plan-1",
    goal: "Học Java backend",
    plan: {
        weeks: [
            { week: 1, focus: "Cơ bản", tasks: [task("a"), task("b"), task("c")] },
            { week: 2, focus: "Nâng cao", tasks: [task("d"), task("e"), task("f")] },
        ],
    },
    progress: { done: ["w1:0"] },
    status: "ACTIVE",
    percentDone: 17,
})

describe("buildTaskKey", () => {
    it("formats w{week}:{index} (spec scenario: week 2 task 0 → w2:0)", () => {
        expect(buildTaskKey(2, 0)).toBe("w2:0")
        expect(buildTaskKey(1, 2)).toBe("w1:2")
    })
})

describe("planTaskKeys", () => {
    it("derives all keys in document order from the seed plan", () => {
        expect(planTaskKeys(seedView().plan)).toEqual([
            "w1:0",
            "w1:1",
            "w1:2",
            "w2:0",
            "w2:1",
            "w2:2",
        ])
    })

    it("skips malformed weeks (missing/negative week number) like the BE guard", () => {
        const keys = planTaskKeys({
            weeks: [
                { week: 1, tasks: [task("a")] },
                { week: -1, tasks: [task("bad")] },
                { week: undefined as unknown as number, tasks: [task("bad")] },
                { week: 2, tasks: [task("b")] },
            ],
        })
        expect(keys).toEqual(["w1:0", "w2:0"])
    })

    it("returns [] for a null/empty plan", () => {
        expect(planTaskKeys(null)).toEqual([])
        expect(planTaskKeys({ weeks: [] })).toEqual([])
    })
})

describe("isTaskDone", () => {
    it("reads membership of progress.done", () => {
        const view = seedView()
        expect(isTaskDone(view.progress, "w1:0")).toBe(true)
        expect(isTaskDone(view.progress, "w2:0")).toBe(false)
        expect(isTaskDone(null, "w1:0")).toBe(false)
    })
})

describe("computePercentDone", () => {
    it("matches the BE seed: 1/6 done → 17", () => {
        const view = seedView()
        expect(computePercentDone(view.plan, view.progress)).toBe(17)
    })

    it("ignores stale keys that map to no real task (BE guard parity)", () => {
        const view = seedView()
        expect(
            computePercentDone(view.plan, { done: ["w1:0", "w9:9", "nonsense"] }),
        ).toBe(17)
    })

    it("dedupes repeated done keys", () => {
        const view = seedView()
        expect(computePercentDone(view.plan, { done: ["w1:0", "w1:0"] })).toBe(17)
    })

    it("returns 0 when the plan has no tasks", () => {
        expect(computePercentDone(null, { done: ["w1:0"] })).toBe(0)
        expect(computePercentDone({ weeks: [] }, { done: [] })).toBe(0)
    })
})

describe("applyProgress", () => {
    it("checks a task off optimistically: w2:0 done → 2/6 = 33", () => {
        const next = applyProgress(seedView(), "w2:0", true)
        expect(next.progress?.done).toEqual(["w1:0", "w2:0"])
        expect(next.percentDone).toBe(33)
    })

    it("unchecks back down: remove w1:0 → 0%", () => {
        const next = applyProgress(seedView(), "w1:0", false)
        expect(next.progress?.done).toEqual([])
        expect(next.percentDone).toBe(0)
    })

    it("is idempotent on a double check (dedupe)", () => {
        const once = applyProgress(seedView(), "w2:0", true)
        const twice = applyProgress(once, "w2:0", true)
        expect(twice.progress?.done).toEqual(["w1:0", "w2:0"])
        expect(twice.percentDone).toBe(33)
    })

    it("never mutates the input view (rollback-safe)", () => {
        const original = seedView()
        const snapshot = JSON.parse(JSON.stringify(original))
        applyProgress(original, "w2:1", true)
        expect(original).toEqual(snapshot)
    })
})
