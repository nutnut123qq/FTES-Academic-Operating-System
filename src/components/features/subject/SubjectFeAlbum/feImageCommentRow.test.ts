import { describe, expect, it } from "vitest"

import { toFeImagePostComment } from "./feImageCommentRow"
import type { FeImageCommentView } from "@/modules/api/rest/resource"

/**
 * Unit — how an FE-album comment is signed.
 *
 * This thread's BE contract ships NO author card: every row, stored or unsaved, is just a
 * `userId`. That is why the reader's own name and photo are applied HERE and not in the
 * optimistic insert — a rule that runs at render time lands on the placeholder AND on the
 * row the POST returns, which is the only arrangement where a comment cannot re-identify
 * itself halfway through. The test that matters most is therefore the last one: placeholder
 * in, server row in, identical identity out.
 *
 * Nobody ELSE is named: with no card to read from, another member's row keeps the raw-id
 * degradation the shared thread block already renders its "member" label from.
 */

const viewer = {
    userId: "u1",
    username: "minhdev",
    displayName: "Minh Dev",
    avatarUrl: "https://cdn/minh.png",
}

const row = (over: Partial<FeImageCommentView> = {}): FeImageCommentView => ({
    id: "c1",
    imageId: "img-1",
    userId: "u1",
    parentId: null,
    content: "đáp án câu 3",
    status: "VISIBLE",
    createdAt: "2026-08-17T00:00:00Z",
    replies: [],
    ...over,
})

describe("toFeImagePostComment", () => {
    it("names the reader's own comment with their display name, handle and photo", () => {
        const mapped = toFeImagePostComment(row(), "vi", viewer)

        expect(mapped.author).toBe("Minh Dev")
        expect(mapped.authorUsername).toBe("minhdev")
        expect(mapped.authorAvatar).toBe("https://cdn/minh.png")
    })

    it("leaves SOMEBODY ELSE on the raw-id degradation — no identity is guessed at", () => {
        const mapped = toFeImagePostComment(row({ userId: "u2" }), "vi", viewer)

        expect(mapped.author).toBe("u2")
        expect(mapped.authorUsername).toBe("u2")
        expect(mapped.authorAvatar).toBeNull()
    })

    it("degrades every row for a guest / unhydrated session, exactly as before", () => {
        const mapped = toFeImagePostComment(row(), "vi", null)

        expect(mapped.author).toBe("u1")
        expect(mapped.authorUsername).toBe("u1")
        expect(mapped.authorAvatar).toBeNull()
    })

    it("empties the owner key on a tombstone, so a deleted row offers no ⋯ menu", () => {
        const mapped = toFeImagePostComment(
            row({ status: "DELETED", userId: null }),
            "vi",
            viewer,
        )

        expect(mapped.authorUsername).toBe("")
        expect(mapped.authorAvatar).toBeNull()
    })

    it("signs the reader's own REPLIES too, not just their top-level comments", () => {
        const mapped = toFeImagePostComment(
            row({ userId: "u2", replies: [row({ id: "r1", parentId: "c1" })] }),
            "vi",
            viewer,
        )

        expect(mapped.author).toBe("u2")
        expect(mapped.replies?.[0]?.author).toBe("Minh Dev")
        expect(mapped.replies?.[0]?.authorAvatar).toBe("https://cdn/minh.png")
    })

    it("gives the placeholder and the stored row the SAME identity — nothing swaps", () => {
        // What `buildOptimisticFeImageComment` puts in the cache while the POST is in
        // flight: a temporary id, the viewer's `userId`, and nothing else about the author.
        const placeholder = row({ id: "optimistic-123", createdAt: "2026-08-17T00:00:01Z" })
        // What the BE answers: a real id and its own timestamp — same `userId`.
        const stored = row({ id: "real-id", createdAt: "2026-08-17T00:00:02Z" })

        const before = toFeImagePostComment(placeholder, "vi", viewer)
        const after = toFeImagePostComment(stored, "vi", viewer)

        expect(after.author).toBe(before.author)
        expect(after.authorUsername).toBe(before.authorUsername)
        expect(after.authorAvatar).toBe(before.authorAvatar)
        expect(after.text).toBe(before.text)
        expect(after.id).not.toBe(before.id)
    })
})
