import { describe, expect, it } from "vitest"
import type { QuestItemView } from "@/modules/api/rest/gamification"
import { questCtaHref, questProgress } from "./model"

/**
 * Unit — the pure quest-board helpers (`questProgress`, `questCtaHref`) that back
 * the `/quests` page. These own the two things the spec pins:
 *  - the progress arithmetic (ceiling = targetCount × dailyLimit, clamped, no
 *    divide-by-zero) and the "done" state (`completedCount ≥ dailyLimit`),
 *  - the code → CTA route map, including graceful degradation for auto-complete
 *    quests (`DAILY_LOGIN`) and unknown/admin codes (→ no CTA).
 */

/** Build a quest row with sensible defaults, overridable per test. */
const quest = (over: Partial<QuestItemView> = {}): QuestItemView => ({
    code: "LESSON_COMPLETE",
    title: "Hoàn thành một bài học",
    description: null,
    rewardCoin: 50,
    targetCount: 1,
    dailyLimit: 1,
    eventCount: 0,
    completedCount: 0,
    coinEarnedToday: 0,
    sortOrder: 0,
    ...over,
})

describe("questProgress", () => {
    it("tracks events toward the day ceiling (targetCount × dailyLimit)", () => {
        // comment quest: target 1 per claim, limit 2 → ceiling 2; one comment in
        const p = questProgress(quest({ targetCount: 1, dailyLimit: 2, eventCount: 1 }))
        expect(p.total).toBe(2)
        expect(p.current).toBe(1)
        expect(p.percent).toBe(50)
    })

    it("clamps an over-counted eventCount to the ceiling (never past 100%)", () => {
        const p = questProgress(quest({ targetCount: 3, dailyLimit: 1, eventCount: 99 }))
        expect(p.total).toBe(3)
        expect(p.current).toBe(3)
        expect(p.percent).toBe(100)
    })

    it("guards a malformed zero ceiling against divide-by-zero", () => {
        const p = questProgress(quest({ targetCount: 0, dailyLimit: 0, eventCount: 0 }))
        expect(p.total).toBe(1)
        expect(p.current).toBe(0)
        expect(p.percent).toBe(0)
        expect(p.isDone).toBe(false)
    })

    it("is done only once every daily claim is used", () => {
        expect(questProgress(quest({ dailyLimit: 2, completedCount: 1 })).isDone).toBe(false)
        expect(questProgress(quest({ dailyLimit: 2, completedCount: 2 })).isDone).toBe(true)
        expect(questProgress(quest({ dailyLimit: 2, completedCount: 3 })).isDone).toBe(true)
    })
})

describe("questCtaHref", () => {
    it("maps every known earning code to its surface (locale-prefixed)", () => {
        expect(questCtaHref("LESSON_COMPLETE", "vi")).toBe("/vi/courses/me")
        expect(questCtaHref("COMMUNITY_POST", "vi")).toBe("/vi/community/new")
        expect(questCtaHref("COMMUNITY_COMMENT", "vi")).toBe("/vi/community")
        expect(questCtaHref("LIKE_3_POSTS", "vi")).toBe("/vi/community")
        expect(questCtaHref("STREAK_7_BONUS", "vi")).toBe("/vi/profile/progress")
    })

    it("honours the active locale in the prefix", () => {
        expect(questCtaHref("LESSON_COMPLETE", "en")).toBe("/en/courses/me")
        expect(questCtaHref("COMMUNITY_POST", "en")).toBe("/en/community/new")
    })

    it("returns null for the auto-complete DAILY_LOGIN quest", () => {
        expect(questCtaHref("DAILY_LOGIN", "vi")).toBeNull()
    })

    it("degrades gracefully to no CTA for unknown/admin codes", () => {
        expect(questCtaHref("SOME_ADMIN_QUEST", "vi")).toBeNull()
        expect(questCtaHref("", "vi")).toBeNull()
    })
})
