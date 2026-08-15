import { describe, expect, it } from "vitest"
import { reconcileAppearance, toServerAccent } from "./sync"
import type { LocalAppearance } from "./sync"

/**
 * Unit — the server-vs-local rule for the appearance the account carries.
 *
 * The interesting cases are the ones where the two sources disagree: a value the
 * account never set must NOT reset what this browser is already showing, and a
 * value the account did set must win even though localStorage has an answer of
 * its own (that is the whole point of syncing per account instead of per device).
 */
describe("reconcileAppearance", () => {
    /** What this browser remembered — deliberately different from every server value below. */
    const local: LocalAppearance = { accent: "teal", accentCustom: "#123456", effect: "snow" }

    it("keeps the local values for a guest (no account to read from)", () => {
        expect(reconcileAppearance(null, local)).toEqual(local)
        expect(reconcileAppearance(undefined, local)).toEqual(local)
    })

    it("keeps the local values when the account never chose", () => {
        expect(reconcileAppearance({ accentColor: null, backgroundEffect: null }, local))
            .toEqual(local)
    })

    it("lets a stored preset win and clears the local custom colour", () => {
        expect(reconcileAppearance({ accentColor: "violet", backgroundEffect: "aurora" }, local))
            .toEqual({ accent: "violet", accentCustom: null, effect: "aurora" })
    })

    it("lets a stored hex win while keeping the preset underneath it", () => {
        expect(reconcileAppearance({ accentColor: "#ff8800", backgroundEffect: "none" }, local))
            .toEqual({ accent: "teal", accentCustom: "#ff8800", effect: "none" })
    })

    it("reconciles each field on its own", () => {
        expect(reconcileAppearance({ accentColor: null, backgroundEffect: "rain" }, local))
            .toEqual({ accent: "teal", accentCustom: "#123456", effect: "rain" })
    })

    it("falls back to local for values this build cannot render", () => {
        // unknown effect name / malformed colour (older build, hand-edited row):
        // showing the user's own look beats snapping to the hard default
        expect(reconcileAppearance({ accentColor: "chartreuse", backgroundEffect: "disco" }, local))
            .toEqual(local)
    })
})

describe("toServerAccent", () => {
    it("sends the custom colour when there is one, else the preset", () => {
        expect(toServerAccent("teal", "#abcdef")).toBe("#abcdef")
        expect(toServerAccent("teal", null)).toBe("teal")
        // garbage custom value must not be what lands on the account
        expect(toServerAccent("amber", "not-a-colour")).toBe("amber")
    })
})
