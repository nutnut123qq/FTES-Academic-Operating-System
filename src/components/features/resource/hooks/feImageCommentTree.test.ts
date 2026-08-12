import { describe, expect, it } from "vitest"

import {
    FE_IMAGE_COMMENT_DELETED,
    buildOptimisticFeImageComment,
    insertFeImageComment,
    replaceFeImageComment,
    tombstoneFeImageComment,
} from "./feImageCommentTree"
import type { FeImageCommentPage, FeImageCommentView } from "@/modules/api/rest/resource"

/**
 * Cache surgery for the FE-album per-image comment thread — the pins the challenge
 * sibling (`challengeCommentTree.test.ts`) already carries, because both threads read the
 * same BE contract and this one used to break the first of them:
 *
 * 1. **`total` counts ROOTS.** `FeImageCommentService.list` builds the page from
 *    `findByImageIdAndParentIdIsNullOrderByCreatedAtDesc` and reports
 *    `roots.getTotalElements()`, so a REPLY must NOT bump it. The optimistic insert used
 *    to add 1 for every node, so replying nudged the "Bình luận ảnh này (n)" heading up
 *    and could push `pageCount` past a page the server will never serve.
 * 2. **A soft delete keeps the row and its replies** and stops naming the author, exactly
 *    as the server does — the thread must not collapse under a deleted parent.
 * 3. **A reply-of-reply attaches to the ROOT**, because that is where the BE re-parents it.
 */

const comment = (over: Partial<FeImageCommentView> = {}): FeImageCommentView => ({
    id: "c1",
    imageId: "img1",
    userId: "u1",
    parentId: null,
    content: "body",
    status: "VISIBLE",
    createdAt: "2026-08-12T00:00:00Z",
    replies: [],
    ...over,
})

const page = (items: Array<FeImageCommentView>, total = items.length): FeImageCommentPage => ({
    items,
    page: 1,
    size: 20,
    total,
})

describe("insertFeImageComment", () => {
    it("prepends a root (the BE lists roots newest-first) and counts it", () => {
        const next = insertFeImageComment(page([comment({ id: "old" })]), comment({ id: "new" }))
        expect(next.items.map((item) => item.id)).toEqual(["new", "old"])
        expect(next.total).toBe(2)
    })

    it("appends a reply under its root WITHOUT bumping the root total", () => {
        const next = insertFeImageComment(
            page([comment({ id: "root" })]),
            comment({ id: "r1", parentId: "root" }),
        )
        expect(next.items[0]?.replies.map((reply) => reply.id)).toEqual(["r1"])
        expect(next.total).toBe(1)
    })

    it("leaves the total alone however many replies land on the page", () => {
        const first = insertFeImageComment(
            page([comment({ id: "root" })]),
            comment({ id: "r1", parentId: "root" }),
        )
        const second = insertFeImageComment(first, comment({ id: "r2", parentId: "root" }))
        expect(second.items[0]?.replies).toHaveLength(2)
        expect(second.total).toBe(1)
    })

    it("attaches a reply-of-reply to the root that already holds its parent", () => {
        const root = comment({ id: "root", replies: [comment({ id: "r1", parentId: "root" })] })
        const next = insertFeImageComment(page([root]), comment({ id: "r2", parentId: "r1" }))
        expect(next.items[0]?.replies.map((reply) => reply.id)).toEqual(["r1", "r2"])
        expect(next.total).toBe(1)
    })

    it("drops a reply whose parent is not on this page rather than promoting it", () => {
        const current = page([comment({ id: "root" })])
        expect(insertFeImageComment(current, comment({ id: "x", parentId: "elsewhere" })))
            .toBe(current)
    })
})

describe("replaceFeImageComment", () => {
    it("swaps the placeholder for the stored row, keeping replies already rendered", () => {
        const optimistic = buildOptimisticFeImageComment("img1", "hi", null, "u1")
        expect(optimistic.userId).toBe("u1")

        const withReply = { ...optimistic, replies: [comment({ id: "r1" })] }
        const saved = comment({ id: "real", content: "hi" })
        const next = replaceFeImageComment(page([withReply]), optimistic.id, saved)

        expect(next.items[0]?.id).toBe("real")
        expect(next.items[0]?.replies.map((reply) => reply.id)).toEqual(["r1"])
    })
})

describe("tombstoneFeImageComment", () => {
    it("keeps the row and its replies, and stops naming the author", () => {
        const root = comment({ id: "root", replies: [comment({ id: "r1", parentId: "root" })] })
        const next = tombstoneFeImageComment(page([root]), "root")

        expect(next.items[0]?.status).toBe(FE_IMAGE_COMMENT_DELETED)
        expect(next.items[0]?.userId).toBeNull()
        expect(next.items[0]?.replies).toHaveLength(1)
        // The BODY is the server's to write — the refetch brings the real tombstone text.
        expect(next.items[0]?.content).toBe("body")
    })

    it("reaches a nested reply too", () => {
        const root = comment({ id: "root", replies: [comment({ id: "r1", parentId: "root" })] })
        const next = tombstoneFeImageComment(page([root]), "r1")
        expect(next.items[0]?.replies[0]?.status).toBe(FE_IMAGE_COMMENT_DELETED)
        expect(next.items[0]?.status).toBe("VISIBLE")
    })
})
