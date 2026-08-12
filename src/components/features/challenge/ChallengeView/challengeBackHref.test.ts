import { describe, expect, it } from "vitest"

import { challengeBackHref } from "./challengeBackHref"

/**
 * Unit — where "back" goes from a challenge solve page.
 *
 * Two things ride on this. First the complaint that produced it: a challenge opened
 * from a subject's practice tab used to send the reader to the GLOBAL catalogue, i.e.
 * out of the subject they were working in. Second, the value comes from the query
 * string, so it decides a destination from something anyone can edit — it has to be
 * treated as untrusted, not merely as absent-or-present.
 */
describe("challengeBackHref", () => {
    it("came from a subject: back to THAT subject's practice tab", () => {
        expect(challengeBackHref("CSD201")).toBe("/subjects/CSD201/practice")
    })

    it("no subject: the catalogue, which is the honest fallback", () => {
        // A shared link or a global-catalogue entry carries no subject; sending the
        // reader to a guessed subject would be worse than sending them to the list.
        expect(challengeBackHref(null)).toBe("/challenges")
        expect(challengeBackHref("")).toBe("/challenges")
    })

    it("refuses anything that could aim the link elsewhere", () => {
        // Each of these would otherwise be pasted straight into an href.
        expect(challengeBackHref("../../admin")).toBe("/challenges")
        expect(challengeBackHref("a/b")).toBe("/challenges")
        expect(challengeBackHref("//evil.com")).toBe("/challenges")
        expect(challengeBackHref("https://evil.com")).toBe("/challenges")
        expect(challengeBackHref("CSD201?x=1")).toBe("/challenges")
        expect(challengeBackHref("CSD 201")).toBe("/challenges")
        // Long enough to be a payload rather than a subject code.
        expect(challengeBackHref("C".repeat(33))).toBe("/challenges")
    })

    it("accepts the shapes real subject codes take", () => {
        expect(challengeBackHref("MAD101")).toBe("/subjects/MAD101/practice")
        expect(challengeBackHref("swp-391")).toBe("/subjects/swp-391/practice")
        expect(challengeBackHref("PRN_212")).toBe("/subjects/PRN_212/practice")
    })
})
