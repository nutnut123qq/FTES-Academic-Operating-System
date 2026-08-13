import { describe, expect, it } from "vitest"
import type { SessionView } from "@/modules/api/rest/identity"
import {
    joinSessionMeta,
    partitionSessions,
    resolveSessionDeviceLabel,
} from "./sessions"

/**
 * Unit — the pure mappers behind the "signed-in devices" list.
 *
 * These carry the two rules the spec makes non-negotiable: the CURRENT session must be
 * identifiable and kept out of the per-row sign-out, and a row must stay readable when
 * the backend omits `deviceInfo` / `ip` / timestamps (every one of them is optional on
 * `SessionView`).
 */

/** Builds a `SessionView` with only the fields a case cares about. */
const session = (overrides: Partial<SessionView> & { sid: string }): SessionView => ({
    current: false,
    ...overrides,
})

describe("partitionSessions", () => {
    it("pulls out the current session and leaves the rest", () => {
        const list = [
            session({ sid: "a" }),
            session({ sid: "b", current: true }),
            session({ sid: "c" }),
        ]

        const { current, others } = partitionSessions(list)

        expect(current?.sid).toBe("b")
        expect(others.map((item) => item.sid)).toEqual(["a", "c"])
    })

    it("returns a null current session when the backend flags none", () => {
        const { current, others } = partitionSessions([session({ sid: "a" })])

        expect(current).toBeNull()
        expect(others).toHaveLength(1)
    })

    it("sorts the others by last use, most recent first", () => {
        const list = [
            session({ sid: "old", lastUsedAt: "2026-08-01T10:00:00Z" }),
            session({ sid: "new", lastUsedAt: "2026-08-12T10:00:00Z" }),
            session({ sid: "mid", lastUsedAt: "2026-08-05T10:00:00Z" }),
        ]

        expect(partitionSessions(list).others.map((item) => item.sid)).toEqual([
            "new",
            "mid",
            "old",
        ])
    })

    it("falls back to createdAt and sinks sessions with no timestamp at all", () => {
        const list = [
            session({ sid: "none" }),
            session({ sid: "created", createdAt: "2026-08-02T10:00:00Z" }),
            session({ sid: "used", lastUsedAt: "2026-08-09T10:00:00Z" }),
        ]

        expect(partitionSessions(list).others.map((item) => item.sid)).toEqual([
            "used",
            "created",
            "none",
        ])
    })

    it("never puts the current session in the sign-out-able list", () => {
        const list = [session({ sid: "me", current: true })]

        expect(partitionSessions(list).others).toEqual([])
    })

    it("handles an empty list", () => {
        expect(partitionSessions([])).toEqual({ current: null, others: [] })
    })
})

describe("resolveSessionDeviceLabel", () => {
    it("uses the reported device info", () => {
        expect(
            resolveSessionDeviceLabel(
                session({ sid: "a", deviceInfo: "Chrome · Windows" }),
                "Unknown",
            ),
        ).toBe("Chrome · Windows")
    })

    it("falls back when device info is missing or blank", () => {
        expect(resolveSessionDeviceLabel(session({ sid: "a" }), "Unknown")).toBe("Unknown")
        expect(
            resolveSessionDeviceLabel(session({ sid: "a", deviceInfo: "   " }), "Unknown"),
        ).toBe("Unknown")
    })
})

describe("joinSessionMeta", () => {
    it("joins the reported fragments with a middot", () => {
        expect(joinSessionMeta(["203.0.113.7", "2 hours ago"])).toBe(
            "203.0.113.7 · 2 hours ago",
        )
    })

    it("drops missing fragments instead of leaving a dangling separator", () => {
        expect(joinSessionMeta([undefined, "2 hours ago"])).toBe("2 hours ago")
        expect(joinSessionMeta(["203.0.113.7", null, "  "])).toBe("203.0.113.7")
    })

    it("returns an empty string when nothing was reported", () => {
        expect(joinSessionMeta([undefined, null, ""])).toBe("")
    })
})
