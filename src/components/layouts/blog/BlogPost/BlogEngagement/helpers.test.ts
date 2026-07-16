import { describe, expect, it } from "vitest"

import type { BlogCommentResponse } from "@/modules/api/rest/blog"
import { isCommentOwner, mergeComments, sortComments } from "./helpers"

/**
 * Unit — the pure accumulation/ownership helpers behind {@link BlogEngagement}
 * (change `blog-nav-and-engagement`, task 3.5). Covers page dedupe/accumulate,
 * the stable oldest-first render order, and the owner gate for edit/delete.
 */

const comment = (
    over: Partial<BlogCommentResponse> & Pick<BlogCommentResponse, "id">,
): BlogCommentResponse => ({
    postId: "p1",
    userId: "u1",
    content: "hi",
    emojiCount: 0,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...over,
})

describe("mergeComments — deduplicated page accumulation", () => {
    it("adds every item of the first page", () => {
        const merged = mergeComments(new Map(), [comment({ id: "a" }), comment({ id: "b" })])
        expect([...merged.keys()]).toEqual(["a", "b"])
    })

    it("appends a later page without duplicating ids already seen", () => {
        const page0 = mergeComments(new Map(), [comment({ id: "a" }), comment({ id: "b" })])
        // page 1 overlaps id "b" (e.g. a shifted window) and adds "c"
        const page1 = mergeComments(page0, [comment({ id: "b" }), comment({ id: "c" })])
        expect([...page1.keys()]).toEqual(["a", "b", "c"])
        expect(page1.size).toBe(3)
    })

    it("replaces an existing entry when a newer copy of the same id arrives", () => {
        const first = mergeComments(new Map(), [comment({ id: "a", content: "old" })])
        const second = mergeComments(first, [comment({ id: "a", content: "new" })])
        expect(second.get("a")?.content).toBe("new")
        expect(second.size).toBe(1)
    })

    it("returns the SAME map reference when there is nothing to merge", () => {
        const existing = mergeComments(new Map(), [comment({ id: "a" })])
        expect(mergeComments(existing, undefined)).toBe(existing)
        expect(mergeComments(existing, [])).toBe(existing)
    })
})

describe("sortComments — stable oldest-first order", () => {
    it("orders by createdAt ascending", () => {
        const map = new Map<string, BlogCommentResponse>([
            ["b", comment({ id: "b", createdAt: "2026-07-02T00:00:00Z" })],
            ["a", comment({ id: "a", createdAt: "2026-07-01T00:00:00Z" })],
        ])
        expect(sortComments(map).map((c) => c.id)).toEqual(["a", "b"])
    })

    it("breaks equal timestamps deterministically by id", () => {
        const map = new Map<string, BlogCommentResponse>([
            ["y", comment({ id: "y", createdAt: "2026-07-01T00:00:00Z" })],
            ["x", comment({ id: "x", createdAt: "2026-07-01T00:00:00Z" })],
        ])
        expect(sortComments(map).map((c) => c.id)).toEqual(["x", "y"])
    })
})

describe("isCommentOwner — edit/delete gate", () => {
    it("is true only when the viewer id matches the comment author", () => {
        expect(isCommentOwner(comment({ id: "a", userId: "u1" }), "u1")).toBe(true)
        expect(isCommentOwner(comment({ id: "a", userId: "u1" }), "u2")).toBe(false)
    })

    it("is false for guests (null/undefined viewer id)", () => {
        expect(isCommentOwner(comment({ id: "a", userId: "u1" }), null)).toBe(false)
        expect(isCommentOwner(comment({ id: "a", userId: "u1" }), undefined)).toBe(false)
    })
})
