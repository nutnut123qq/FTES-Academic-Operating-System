import { describe, expect, it } from "vitest"

import {
    CHALLENGE_COMMENT_DELETED,
    buildOptimisticChallengeComment,
    insertChallengeComment,
    replaceChallengeComment,
    tombstoneChallengeComment,
} from "./challengeCommentTree"
import type {
    ChallengeCommentPage,
    ChallengeCommentView,
} from "@/modules/api/rest/challenges/types"

/**
 * Cache surgery for the challenge comment thread. Three things are pinned because each is
 * a decision the BE contract forced, not a convenience:
 *
 * 1. **`total` counts ROOTS.** The BE pages over root comments (`roots.getTotalElements()`),
 *    so a REPLY must not bump it — the pager would otherwise invent pages that do not exist.
 * 2. **A soft delete keeps the row and its replies**, and drops BOTH the author id and the
 *    author card, exactly as the server does — a deleted comment stops naming who wrote it.
 * 3. **A reply-of-reply attaches to the ROOT**, because that is where the BE re-parents it.
 */

const comment = (over: Partial<ChallengeCommentView> = {}): ChallengeCommentView => ({
    id: "c1",
    authorId: "u1",
    author: { userId: "u1", username: "minh", displayName: "Minh", avatarUrl: null },
    parentId: null,
    content: "body",
    status: "VISIBLE",
    createdAt: "2026-08-12T00:00:00Z",
    replies: [],
    ...over,
})

const page = (items: Array<ChallengeCommentView>, total = items.length): ChallengeCommentPage => ({
    items,
    page: 1,
    size: 20,
    total,
})

describe("insertChallengeComment", () => {
    it("prepends a root (the BE lists roots newest-first) and counts it", () => {
        const next = insertChallengeComment(page([comment({ id: "old" })]), comment({ id: "new" }))
        expect(next.items.map((item) => item.id)).toEqual(["new", "old"])
        expect(next.total).toBe(2)
    })

    it("appends a reply under its root WITHOUT bumping the root total", () => {
        const next = insertChallengeComment(
            page([comment({ id: "root" })]),
            comment({ id: "r1", parentId: "root" }),
        )
        expect(next.items[0]?.replies.map((reply) => reply.id)).toEqual(["r1"])
        expect(next.total).toBe(1)
    })

    it("attaches a reply-of-reply to the root that already holds its parent", () => {
        const root = comment({ id: "root", replies: [comment({ id: "r1", parentId: "root" })] })
        const next = insertChallengeComment(
            page([root]),
            comment({ id: "r2", parentId: "r1" }),
        )
        expect(next.items[0]?.replies.map((reply) => reply.id)).toEqual(["r1", "r2"])
    })

    it("drops a reply whose parent is not on this page rather than promoting it", () => {
        const current = page([comment({ id: "root" })])
        expect(insertChallengeComment(current, comment({ id: "x", parentId: "elsewhere" })))
            .toBe(current)
    })
})

describe("replaceChallengeComment", () => {
    it("swaps the placeholder for the stored row, keeping replies already rendered", () => {
        const optimistic = buildOptimisticChallengeComment("hi", null, "u1")
        expect(optimistic.author).toBeNull()
        expect(optimistic.authorId).toBe("u1")

        const withReply = { ...optimistic, replies: [comment({ id: "r1" })] }
        const saved = comment({ id: "real", content: "hi" })
        const next = replaceChallengeComment(page([withReply]), optimistic.id, saved)

        expect(next.items[0]?.id).toBe("real")
        expect(next.items[0]?.author?.displayName).toBe("Minh")
        expect(next.items[0]?.replies.map((reply) => reply.id)).toEqual(["r1"])
    })
})

describe("tombstoneChallengeComment", () => {
    it("keeps the row and its replies, and stops naming the author", () => {
        const root = comment({ id: "root", replies: [comment({ id: "r1", parentId: "root" })] })
        const next = tombstoneChallengeComment(page([root]), "root")

        expect(next.items[0]?.status).toBe(CHALLENGE_COMMENT_DELETED)
        expect(next.items[0]?.authorId).toBeNull()
        expect(next.items[0]?.author).toBeNull()
        expect(next.items[0]?.replies).toHaveLength(1)
        // The BODY is the server's to write — the refetch brings the real tombstone text.
        expect(next.items[0]?.content).toBe("body")
    })

    it("reaches a nested reply too", () => {
        const root = comment({ id: "root", replies: [comment({ id: "r1", parentId: "root" })] })
        const next = tombstoneChallengeComment(page([root]), "r1")
        expect(next.items[0]?.replies[0]?.status).toBe(CHALLENGE_COMMENT_DELETED)
        expect(next.items[0]?.status).toBe("VISIBLE")
    })
})
