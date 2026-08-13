import { describe, expect, it } from "vitest"

import { FREE_POLL_MS, GATED_POLL_MS, isPastLimit, pollIntervalMs } from "./previewPoll"

/**
 * The YouTube preview gate leaks for exactly one poll interval: the IFrame API has no
 * `seeking` event, so a scrub past the limit plays until the next tick notices. These
 * assertions pin the two things that decide how much paid content that is — do not
 * "optimise" the gated cadence back up to a second.
 */
describe("previewPoll", () => {
    it("ticks four times a second while a preview limit is live, and stays cheap without one", () => {
        expect(pollIntervalMs(120)).toBe(GATED_POLL_MS)
        expect(GATED_POLL_MS).toBeLessThanOrEqual(250)

        expect(pollIntervalMs(0)).toBe(FREE_POLL_MS)
        expect(pollIntervalMs(-1)).toBe(FREE_POLL_MS)
    })

    it("treats only playback strictly past the window as needing a clamp", () => {
        expect(isPastLimit(120.5, 120)).toBe(true)

        // exactly at the limit is still inside it — the gate pauses there, it does not seek
        expect(isPastLimit(120, 120)).toBe(false)
        expect(isPastLimit(11, 120)).toBe(false)

        // an unlocked video has no window to fall out of, whatever the playhead says
        expect(isPastLimit(9999, 0)).toBe(false)
    })
})
