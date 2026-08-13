import { describe, expect, it, vi } from "vitest"

/**
 * Hook helper — the post-purchase refresh of the learn shell.
 *
 * Regression: every gate surface used to call its OWN `mutate`, so buying from inside a
 * lesson refreshed that lesson and left the outline beside it drawing padlocks until a
 * reload. The helper must reach all three key families, and must not match a key that
 * merely starts with the same word.
 */
const mutate = vi.fn()
vi.mock("swr", () => ({ mutate: (...args: unknown[]) => mutate(...args) }))

import { revalidateLearnData } from "./revalidateLearnData"

/** The predicate SWR is handed for each family, in call order. */
const filtersOf = () => mutate.mock.calls.map((call) => call[0] as (key: unknown) => boolean)

describe("revalidateLearnData", () => {
    it("revalidates the outline, every lesson, and progress — scoping the outline to one course", async () => {
        mutate.mockClear()
        await revalidateLearnData("khoa-a")

        const [outline, lessons, progress] = filtersOf()
        expect(mutate).toHaveBeenCalledTimes(3)

        // outline: this course only, so a second course open in another tab is left alone
        expect(outline(["GET_LEARN_COURSE", "khoa-a"])).toBe(true)
        expect(outline(["GET_LEARN_COURSE", "khoa-b"])).toBe(false)

        // lessons: EVERY lesson, not just the open one — a package unlocks siblings too
        expect(lessons(["GET_LEARN_LESSON", "khoa-a", "bai-1"])).toBe(true)
        expect(lessons(["GET_LEARN_LESSON", "khoa-b", "bai-9"])).toBe(true)

        expect(progress(["GET_COURSE_PROGRESS", "raw-id"])).toBe(true)

        // and none of them may swallow an unrelated key
        for (const filter of [outline, lessons, progress]) {
            expect(filter(["GET_CART_SWR"])).toBe(false)
            expect(filter("GET_LEARN_COURSE")).toBe(false)
        }
    })
})
