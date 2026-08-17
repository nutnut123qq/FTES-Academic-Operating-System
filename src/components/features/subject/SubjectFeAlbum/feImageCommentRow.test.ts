import { describe, expect, it } from "vitest"

import { toFeImagePostComment } from "./feImageCommentRow"
import type { FeImageCommentView } from "@/modules/api/rest/resource"

/**
 * Unit — how an FE-album comment is signed.
 *
 * There are three sources of a name and the PRECEDENCE between them is the contract:
 * the BE's author card (`fe-album-author-cards`) outranks the viewer's session card, which
 * outranks nothing at all. Only the first can name somebody else; the second exists for the
 * optimistic row a POST has not returned yet, and for a backend that predates the card.
 *
 * The viewer-card path is applied at RENDER time rather than in the optimistic insert, so it
 * lands on the placeholder AND on the row the POST returns — the only arrangement where a
 * comment cannot re-identify itself halfway through.
 *
 * What must never happen, and is asserted below: a row the server could not attribute
 * acquiring a plausible name.
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

    it("names SOMEBODY ELSE from the BE card — the case the viewer card can never cover", () => {
        const mapped = toFeImagePostComment(
            row({
                userId: "u9",
                author: {
                    userId: "u9",
                    username: "khoana71",
                    displayName: "Nguyễn Anh Khoa",
                    avatarUrl: "https://cdn/khoa.jpg",
                },
            }),
            "vi",
            viewer,
        )

        expect(mapped.author).toBe("Nguyễn Anh Khoa")
        expect(mapped.authorUsername).toBe("khoana71")
        expect(mapped.authorAvatar).toBe("https://cdn/khoa.jpg")
    })

    it("carries the card into nested replies — the BE resolves them in the same batch", () => {
        const mapped = toFeImagePostComment(
            row({
                userId: "u9",
                author: { userId: "u9", username: "khoana71", displayName: "Nguyễn Anh Khoa" },
                replies: [
                    row({
                        id: "r1",
                        parentId: "c1",
                        userId: "u8",
                        author: { userId: "u8", displayName: "Trần Bình" },
                    }),
                ],
            }),
            "vi",
            viewer,
        )

        expect(mapped.replies?.[0]?.author).toBe("Trần Bình")
    })

    it("falls back to the handle when the profile carries no display name", () => {
        const mapped = toFeImagePostComment(
            row({ userId: "u9", author: { userId: "u9", username: "khoana71" } }),
            "vi",
            viewer,
        )

        expect(mapped.author).toBe("khoana71")
    })

    it("lets the BE card outrank the viewer card on the reader's OWN row", () => {
        // Same person, but the server knows a newer display name than the cached session.
        const mapped = toFeImagePostComment(
            row({ author: { userId: "u1", username: "minhdev", displayName: "Minh Đã Đổi Tên" } }),
            "vi",
            viewer,
        )

        expect(mapped.author).toBe("Minh Đã Đổi Tên")
    })

    it("still prints NO name when the server could not attribute the row", () => {
        // Stranger, no card (older backend, or an author with no profile row). The row must
        // stay unattributed — the shared thread renders its "member" label from this.
        const mapped = toFeImagePostComment(row({ userId: "u9" }), "vi", viewer)

        expect(mapped.author).toBe("u9")
        expect(mapped.authorAvatar).toBeNull()
    })

    it("drops the card on a tombstone — a deleted comment names nobody", () => {
        const mapped = toFeImagePostComment(
            row({
                status: "DELETED",
                userId: null,
                author: { userId: "u9", displayName: "Nguyễn Anh Khoa" },
            }),
            "vi",
            viewer,
        )

        expect(mapped.author).not.toBe("Nguyễn Anh Khoa")
        expect(mapped.authorUsername).toBe("")
        expect(mapped.authorAvatar).toBeNull()
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
