import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the viewer's own author card, the single source every comment thread signs an
 * unsaved comment with.
 *
 * What is pinned here is the DEGRADE rule, because that is the half that can do damage.
 * Filling a name is only safe while the name is the viewer's real one; the moment the
 * session cannot name anybody, the card must be `null` so each caller keeps its own honest
 * fallback ("Bạn", or the raw id the surface already degraded to) instead of painting a
 * blank identity over it.
 */

const session = vi.hoisted(() => ({ current: null as unknown }))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { user: { user: unknown } }) => unknown) =>
        selector({ user: { user: session.current } }),
}))

import { useViewerAuthorCard, viewerAuthorName, viewerOwnRowCard } from "./useViewerAuthorCard"

/** A hydrated session user, as `useQueryUserSwr` writes it into the store. */
const sessionUser = (over: Record<string, unknown> = {}) => ({
    id: "u1",
    username: "minhdev",
    displayName: "Minh Dev",
    avatar: "https://cdn/minh.png",
    ...over,
})

beforeEach(() => {
    session.current = null
})

describe("useViewerAuthorCard", () => {
    it("reads name, handle and photo straight off the hydrated session", () => {
        session.current = sessionUser()
        const { result } = renderHook(() => useViewerAuthorCard())

        expect(result.current).toEqual({
            userId: "u1",
            username: "minhdev",
            displayName: "Minh Dev",
            avatarUrl: "https://cdn/minh.png",
        })
    })

    it("degrades to null for a guest — nothing to sign a comment with", () => {
        session.current = null
        const { result } = renderHook(() => useViewerAuthorCard())
        expect(result.current).toBeNull()
    })

    it("degrades to null when the session cannot NAME the viewer, even with an id + photo", () => {
        session.current = sessionUser({ username: "", displayName: null })
        const { result } = renderHook(() => useViewerAuthorCard())
        // A card that can only supply a face would replace the caller's honest fallback
        // label with an empty one — worse than the behaviour it is meant to fix.
        expect(result.current).toBeNull()
    })

    it("keeps the card when only the handle exists — a handle can name someone", () => {
        session.current = sessionUser({ displayName: null, avatar: undefined })
        const { result } = renderHook(() => useViewerAuthorCard())

        expect(result.current?.username).toBe("minhdev")
        expect(result.current?.displayName).toBeNull()
        expect(result.current?.avatarUrl).toBeNull()
    })

    it("holds the same reference across renders, so a memoized thread does not rebuild", () => {
        session.current = sessionUser()
        const { result, rerender } = renderHook(() => useViewerAuthorCard())
        const first = result.current
        rerender()
        expect(result.current).toBe(first)
    })
})

describe("viewerAuthorName", () => {
    it("prefers the display name, then the handle — the order every BE mapper uses", () => {
        expect(viewerAuthorName({ userId: "u1", username: "m", displayName: "Minh", avatarUrl: null }, "Bạn"))
            .toBe("Minh")
        expect(viewerAuthorName({ userId: "u1", username: "m", displayName: null, avatarUrl: null }, "Bạn"))
            .toBe("m")
    })

    it("falls back to the caller's own label when there is no card", () => {
        expect(viewerAuthorName(null, "Bạn")).toBe("Bạn")
    })
})

describe("viewerOwnRowCard", () => {
    const card = { userId: "u1", username: "minhdev", displayName: "Minh Dev", avatarUrl: null }

    it("claims the viewer's own live row by user id", () => {
        expect(viewerOwnRowCard(card, "u1", false)).toBe(card)
    })

    it("never claims somebody else's row", () => {
        expect(viewerOwnRowCard(card, "u2", false)).toBeNull()
    })

    it("never claims a tombstone — a deleted comment stops naming its author", () => {
        expect(viewerOwnRowCard(card, "u1", true)).toBeNull()
    })

    it("claims nothing at all for a guest", () => {
        expect(viewerOwnRowCard(null, "u1", false)).toBeNull()
    })
})
