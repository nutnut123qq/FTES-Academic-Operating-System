import { describe, expect, it } from "vitest"
import en from "@/messages/en.json"
import vi from "@/messages/vi.json"
import { getAssistantBubbles, getAssistantOptions } from "./options"

/**
 * Contract — every i18n key the mascot assistant reaches for MUST exist in BOTH
 * catalogs.
 *
 * The keys are built by template string (`mascot.assistant.options.${key}.label`,
 * `subjects.aiTools.tools.${key}.title`), so a typo or a forgotten translation is
 * invisible to the type checker AND to the eye: next-intl renders the key path
 * itself, and the panel quietly shows "mascot.assistant.bubble.progress" to a
 * learner. That is exactly the failure this pins.
 *
 * It also pins the SHAPE of the contextual sets: short lists everywhere except the
 * AI hub, every list reachable onward, and every row with something to activate.
 */

/** Follow a dotted i18n path; returns the string, or null when it is missing. */
const lookup = (catalog: unknown, path: string): string | null => {
    let cursor: unknown = catalog
    for (const part of path.split(".")) {
        if (typeof cursor !== "object" || cursor === null || !(part in cursor)) {
            return null
        }
        cursor = (cursor as Record<string, unknown>)[part]
    }
    return typeof cursor === "string" ? cursor : null
}

/** Routes worth pinning — one per branch of the route table, plus the fallback. */
const ROUTES = [
    "/",
    "/home",
    "/ai",
    "/ai/tools/planner",
    "/courses",
    "/courses/abc",
    "/courses/abc/learn/content/modules/m1/contents/c1",
    "/subjects/PRF192",
    "/subjects/PRF192/practice",
    "/challenges",
    "/practice",
    "/workflow",
    "/profile",
    "/profile/cv",
    "/career",
    "/marketplace",
    "/resources",
    "/blog",
    "/search",
    "/community",
    "/dashboard",
]

describe("mascot assistant — every key resolves in both locales", () => {
    it.each(ROUTES)("panel rows on %s", (route) => {
        const set = getAssistantOptions(route)
        for (const key of [set.titleKey, set.subtitleKey]) {
            expect(lookup(vi, key), `vi missing ${key}`).not.toBeNull()
            expect(lookup(en, key), `en missing ${key}`).not.toBeNull()
        }
        for (const option of set.options) {
            for (const key of [option.labelKey, option.descriptionKey]) {
                expect(lookup(vi, key), `vi missing ${key}`).not.toBeNull()
                expect(lookup(en, key), `en missing ${key}`).not.toBeNull()
            }
        }
    })

    it.each(ROUTES)("proactive lines on %s", (route) => {
        const bubbles = getAssistantBubbles(route)
        expect(bubbles.length).toBeGreaterThan(0)
        for (const bubble of bubbles) {
            expect(lookup(vi, bubble.messageKey), `vi missing ${bubble.messageKey}`).not.toBeNull()
            expect(lookup(en, bubble.messageKey), `en missing ${bubble.messageKey}`).not.toBeNull()
        }
    })
})

describe("mascot assistant — shape of the contextual sets", () => {
    it("keeps ordinary pages short and the AI hub complete", () => {
        // a nudge, not a directory
        expect(getAssistantOptions("/").options.length).toBeLessThanOrEqual(4)
        expect(getAssistantOptions("/courses").options.length).toBeLessThanOrEqual(4)
        // the one surface people visit BECAUSE they want the tool list
        expect(getAssistantOptions("/ai").options.length).toBeGreaterThan(4)
    })

    it("never leaves a short list without a way to the rest", () => {
        for (const route of ["/", "/courses", "/challenges", "/profile", "/resources"]) {
            const keys = getAssistantOptions(route).options.map((option) => option.key)
            expect(keys, `${route} has no route onward`).toContain("chat")
        }
    })

    it("leads with the grounded lesson chat while a lesson is open", () => {
        const options = getAssistantOptions("/courses/abc/learn/content/modules/m1/contents/c1").options
        expect(options[0].key).toBe("lessonChat")
        // no route of its own — it opens a panel on the page already open
        expect(options[0].href).toBeUndefined()
        expect(options[0].action).toBe("openLessonChat")
    })

    it("gives every row something to activate", () => {
        for (const route of ROUTES) {
            for (const option of getAssistantOptions(route).options) {
                expect(
                    option.href !== undefined || option.action !== undefined,
                    `${route} → row "${option.key}" goes nowhere`,
                ).toBe(true)
            }
        }
    })

    it("sends the lesson line to the grounded chat, and small talk nowhere", () => {
        const lesson = getAssistantBubbles("/courses/abc/learn/content/modules/m1/contents/c1")
        expect(lesson.every((bubble) => bubble.action === "openLessonChat")).toBe(true)

        // small talk has no destination: clicking it just opens the menu
        const small = getAssistantBubbles("/community")
        expect(small.every((bubble) => bubble.href === undefined && bubble.action === undefined)).toBe(true)
        expect(small.length).toBe(10)
    })
})
