import { describe, expect, it } from "vitest"
import en from "@/messages/en.json"
import vi from "@/messages/vi.json"
import {
    ACTIVITY_FALLBACK_MESSAGE_KEY,
    ACTIVITY_MESSAGE_KEYS,
    activityMessageKey,
} from "./model"

/**
 * The timeline used to print raw BE event types (`profile.updated`,
 * `resource.fe.image.added`) at the reader. These lock the two halves of the fix: known
 * types resolve to a sentence key, and everything else lands on the generic fallback
 * instead of the identifier.
 */
describe("activityMessageKey", () => {
    it("maps catalogued BE event types to their own sentence key", () => {
        expect(activityMessageKey("profile.updated")).toBe("profileUpdated")
        expect(activityMessageKey("resource.submitted")).toBe("resourceSubmitted")
        expect(activityMessageKey("resource.fe.image.added")).toBe("feImageAdded")
    })

    it("gives synonymous types one shared sentence", () => {
        expect(activityMessageKey("course.enrollment.completed"))
            .toBe(activityMessageKey("course.completed"))
    })

    it("falls back to the generic sentence for an unknown type", () => {
        // a type shipped by a new BE module before anyone translated it
        expect(activityMessageKey("warehouse.pallet.scanned"))
            .toBe(ACTIVITY_FALLBACK_MESSAGE_KEY)
    })

    it("never returns the raw type, even for empty or missing input", () => {
        expect(activityMessageKey("")).toBe(ACTIVITY_FALLBACK_MESSAGE_KEY)
        expect(activityMessageKey(undefined)).toBe(ACTIVITY_FALLBACK_MESSAGE_KEY)
        expect(activityMessageKey("resource.fe.image.exploded"))
            .toBe(ACTIVITY_FALLBACK_MESSAGE_KEY)
    })

    it("has a sentence in both catalogs for every key it can return", () => {
        const missing = ACTIVITY_MESSAGE_KEYS.flatMap((key) => [
            ...(key in en.activity.events ? [] : [`en → activity.events.${key}`]),
            ...(key in vi.activity.events ? [] : [`vi → activity.events.${key}`]),
        ])
        expect(missing).toEqual([])
    })
})
