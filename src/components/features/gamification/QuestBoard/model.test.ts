import { describe, expect, it } from "vitest"
import type { QuestItemView } from "@/modules/api/rest/gamification"
import { questCtaHref, questDestination, questProgress, questRewardXp } from "./model"

/**
 * Unit — the pure quest-board helpers (`questProgress`, `questCtaHref`,
 * `questRewardXp`) that back the `/quests` page. These own the three things the
 * spec pins:
 *  - the progress arithmetic (ceiling = targetCount × dailyLimit, clamped, no
 *    divide-by-zero) and the "done" state (`completedCount ≥ dailyLimit`),
 *  - the code → route map (shared by BOTH quest surfaces via `questDestination`),
 *    including the codes with nowhere to go — auto-complete (`DAILY_LOGIN`),
 *    keep-a-streak (`STREAK_7_BONUS`), already-claimed-today and unknown/admin
 *    codes all resolve to `null` so their rows render non-interactive,
 *  - the EXP reward's THREE-valued input (number / `null` / absent) collapsing to
 *    "render this number" vs "render nothing" — with `0` on the RENDER side, so
 *    `null` and `0` can never be confused for one another.
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

describe("questRewardXp", () => {
    it("returns the quoted per-claim EXP", () => {
        expect(questRewardXp(quest({ rewardXp: 100 }))).toBe(100)
    })

    // ★ The pin that matters. `null` and `0` are DIFFERENT backend answers:
    // `null` = "this quest pays no EXP / I have nothing to quote", `0` = "this
    // rule genuinely pays zero". A `?? 0` here would erase the difference and
    // print a precise-looking "+0 EXP" the backend never said.
    it("keeps `null` and `0` apart — null is nothing to render, 0 is a real zero", () => {
        expect(questRewardXp(quest({ rewardXp: null }))).toBeNull()
        expect(questRewardXp(quest({ rewardXp: 0 }))).toBe(0)
        // and the two must not be interchangeable
        expect(questRewardXp(quest({ rewardXp: null }))).not.toBe(0)
    })

    // A backend that has not deployed `rewardXp` omits the key entirely; the UI
    // must survive it exactly like an explicit null — no chip, no fabricated 0.
    it("treats an absent field (undeployed backend) as nothing to render", () => {
        const legacy = quest()
        expect("rewardXp" in legacy).toBe(false)
        expect(questRewardXp(legacy)).toBeNull()
    })

    it("treats a non-finite value as nothing to render rather than printing NaN", () => {
        expect(questRewardXp(quest({ rewardXp: Number.NaN }))).toBeNull()
    })

    // `triggerEventXp` is what the ACTIVITY pays, not what the QUEST pays. The
    // reward helper must ignore it outright — never return it, never add it in.
    it("ignores triggerEventXp entirely and never sums the two", () => {
        expect(questRewardXp(quest({ rewardXp: 100, triggerEventXp: 500 }))).toBe(100)
        expect(questRewardXp(quest({ rewardXp: null, triggerEventXp: 500 }))).toBeNull()
    })
})

describe("questCtaHref", () => {
    it("maps every known earning code to its surface", () => {
        expect(questCtaHref("LESSON_COMPLETE")).toBe("/courses/me")
        expect(questCtaHref("COMMUNITY_POST")).toBe("/community/new")
        expect(questCtaHref("COMMUNITY_COMMENT")).toBe("/community")
        expect(questCtaHref("LIKE_3_POSTS")).toBe("/community")
    })

    // Regression: these hrefs are rendered through the locale-aware `Link` of
    // `@/i18n/navigation`, which prepends the active locale. When the helper
    // prefixed a locale too, every CTA resolved to `/vi/vi/...` — a real 404.
    it("emits NO locale prefix, so the locale-aware Link can add exactly one", () => {
        const codes = ["LESSON_COMPLETE", "COMMUNITY_POST", "COMMUNITY_COMMENT", "LIKE_3_POSTS"]
        for (const code of codes) {
            const href = questCtaHref(code)
            expect(href).not.toBeNull()
            expect(href).not.toMatch(/^\/(vi|en)(\/|$)/)
        }
    })

    it("returns null for the auto-complete DAILY_LOGIN quest", () => {
        expect(questCtaHref("DAILY_LOGIN")).toBeNull()
    })

    // A streak is earned by coming back tomorrow, not by opening a page. The
    // progress page only DISPLAYS the streak, so linking there advertised an
    // action that could not pay the quest — the row is honest as plain text.
    it("returns null for STREAK_7_BONUS — a streak is kept, not visited", () => {
        expect(questCtaHref("STREAK_7_BONUS")).toBeNull()
    })

    it("degrades gracefully to no CTA for unknown/admin codes", () => {
        expect(questCtaHref("SOME_ADMIN_QUEST")).toBeNull()
        expect(questCtaHref("")).toBeNull()
    })
})

describe("questDestination", () => {
    // The single entry point BOTH quest surfaces call — the `/quests` board and
    // the dashboard's compact widget. Everything the two must agree on lives here.
    it("hands a not-done, mapped quest its route", () => {
        expect(questDestination({ code: "LESSON_COMPLETE", isDone: false })).toBe("/courses/me")
        expect(questDestination({ code: "COMMUNITY_POST", isDone: false })).toBe("/community/new")
        expect(questDestination({ code: "COMMUNITY_COMMENT", isDone: false })).toBe("/community")
        expect(questDestination({ code: "LIKE_3_POSTS", isDone: false })).toBe("/community")
    })

    // Nothing is left to earn today, so a link would only nag the reader into
    // repeating work that pays nothing.
    it("withholds the route once every claim for the day is used", () => {
        expect(questDestination({ code: "LESSON_COMPLETE", isDone: true })).toBeNull()
        expect(questDestination({ code: "COMMUNITY_POST", isDone: true })).toBeNull()
    })

    it("stays null for the destination-less codes even when not done", () => {
        expect(questDestination({ code: "DAILY_LOGIN", isDone: false })).toBeNull()
        expect(questDestination({ code: "STREAK_7_BONUS", isDone: false })).toBeNull()
        expect(questDestination({ code: "SOME_ADMIN_QUEST", isDone: false })).toBeNull()
    })

    // It reads the SAME table `questCtaHref` exposes — no second branch of its own.
    it("agrees with the code table for every seeded code", () => {
        const codes = [
            "DAILY_LOGIN",
            "LESSON_COMPLETE",
            "COMMUNITY_COMMENT",
            "COMMUNITY_POST",
            "LIKE_3_POSTS",
            "STREAK_7_BONUS",
        ]
        for (const code of codes) {
            expect(questDestination({ code, isDone: false })).toBe(questCtaHref(code))
        }
    })
})
