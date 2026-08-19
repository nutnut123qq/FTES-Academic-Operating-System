import { describe, expect, it } from "vitest"

import { withMyRegistrationStatus, type Event } from "./useQueryEventsSwr"

/**
 * Unit — {@link withMyRegistrationStatus}: the catalog's "đã đăng ký" state comes from the
 * viewer's own registrations because the BE list endpoint always sends
 * `myRegistrationStatus: null` (góp ý #18). Getting this wrong shows a live "Đăng ký"
 * button on a seat the viewer already holds — which then fails with a duplicate error.
 */

/** A catalog card with only the fields this merge touches. */
const card = (eventId: string, registrationStatus: string | null = null): Event =>
    ({
        id: `slug-${eventId}`,
        eventId,
        title: eventId,
        type: "webinar",
        date: null,
        status: "PUBLISHED",
        endAtMs: null,
        locationType: null,
        attendees: null,
        registrationStatus,
    }) as Event

const registration = (eventId: string, status: string) =>
    ({ id: `r-${eventId}`, eventId, status, registeredAt: "2026-08-01T00:00:00Z" })

describe("withMyRegistrationStatus", () => {
    it("fills the status the list endpoint left null", () => {
        const merged = withMyRegistrationStatus(
            [card("e1"), card("e2")],
            [registration("e1", "CONFIRMED")],
        )

        expect(merged[0].registrationStatus).toBe("CONFIRMED")
        expect(merged[1].registrationStatus).toBeNull()
    })

    it("carries a CANCELLED row through as-is — that seat was given up", () => {
        // The card treats only CONFIRMED/WAITLISTED as holding a seat, so this must NOT be
        // flattened to "registered"; the viewer has to be able to sign up again.
        const merged = withMyRegistrationStatus([card("e1")], [registration("e1", "CANCELLED")])

        expect(merged[0].registrationStatus).toBe("CANCELLED")
    })

    it("never overwrites a status the backend did resolve", () => {
        // The day `list()` starts resolving it, the server wins and this merge goes quiet.
        const merged = withMyRegistrationStatus(
            [card("e1", "WAITLISTED")],
            [registration("e1", "CONFIRMED")],
        )

        expect(merged[0].registrationStatus).toBe("WAITLISTED")
    })

    it("returns the cards untouched for a guest (no registrations)", () => {
        const cards = [card("e1")]

        expect(withMyRegistrationStatus(cards, [])).toBe(cards)
    })
})
