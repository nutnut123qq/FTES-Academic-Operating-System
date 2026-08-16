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
 * Cache surgery for the challenge comment thread. Four things are pinned because each is
 * a decision the BE contract forced, not a convenience:
 *
 * 1. **`total` counts ROOTS.** The BE pages over root comments (`roots.getTotalElements()`),
 *    so a REPLY must not bump it — the pager would otherwise invent pages that do not exist.
 * 2. **A soft delete keeps the row and its replies**, and drops BOTH the author id and the
 *    author card, exactly as the server does — a deleted comment stops naming who wrote it.
 * 3. **A reply-of-reply attaches to the ROOT**, because that is where the BE re-parents it.
 * 4. **An unsaved comment is SIGNED by whoever wrote it**, and the identity survives the
 *    swap for the stored row untouched. The placeholder used to ship `author: null`, so a
 *    person's own comment appeared anonymous until the POST answered — the bug this pins
 *    shut. The card is the viewer's own, never a guess about a third party, so there is
 *    nothing the server can contradict.
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

/** The viewer's own session card, as `useViewerAuthorCard` hands it to the builder. */
const viewerCard = {
    userId: "u1",
    username: "minh",
    displayName: "Minh",
    avatarUrl: "https://cdn/minh.png",
}

describe("buildOptimisticChallengeComment", () => {
    it("signs the unsaved comment with the writer's name, handle and photo", () => {
        const optimistic = buildOptimisticChallengeComment("hi", null, "u1", viewerCard)

        expect(optimistic.authorId).toBe("u1")
        expect(optimistic.author).toEqual(viewerCard)
        expect(optimistic.content).toBe("hi")
        expect(optimistic.status).toBe("VISIBLE")
    })

    it("degrades to the id-only row when the session cannot name the viewer", () => {
        // Guest, or a session that has not hydrated yet: `useViewerAuthorCard` answers
        // `null` and the placeholder must fall back to exactly what it did before — an
        // owner-gated row with no invented identity, never a half-filled card.
        const optimistic = buildOptimisticChallengeComment("hi", null, "u1", null)

        expect(optimistic.author).toBeNull()
        expect(optimistic.authorId).toBe("u1")
    })

    it("carries no author id at all when there is no viewer either", () => {
        const optimistic = buildOptimisticChallengeComment("hi", null, undefined)
        expect(optimistic.authorId).toBeNull()
        expect(optimistic.author).toBeNull()
    })
})

describe("replaceChallengeComment", () => {
    it("swaps the placeholder for the stored row, keeping replies already rendered", () => {
        const optimistic = buildOptimisticChallengeComment("hi", null, "u1", viewerCard)

        const withReply = { ...optimistic, replies: [comment({ id: "r1" })] }
        const saved = comment({ id: "real", content: "hi" })
        const next = replaceChallengeComment(page([withReply]), optimistic.id, saved)

        expect(next.items[0]?.id).toBe("real")
        expect(next.items[0]?.author?.displayName).toBe("Minh")
        expect(next.items[0]?.replies.map((reply) => reply.id)).toEqual(["r1"])
    })

    it("does not change WHO wrote the comment — the reader sees no name or avatar swap", () => {
        const optimistic = buildOptimisticChallengeComment("hi", null, "u1", viewerCard)
        // What the BE answers for that same account: the card it resolves from the very
        // profile the session was hydrated from.
        const saved = comment({
            id: "real",
            content: "hi",
            authorId: "u1",
            author: {
                userId: "u1",
                username: "minh",
                displayName: "Minh",
                avatarUrl: "https://cdn/minh.png",
            },
        })

        const next = replaceChallengeComment(page([optimistic]), optimistic.id, saved)
        const row = next.items[0]

        expect(row?.authorId).toBe(optimistic.authorId)
        expect(row?.author?.displayName).toBe(optimistic.author?.displayName)
        expect(row?.author?.username).toBe(optimistic.author?.username)
        expect(row?.author?.avatarUrl).toBe(optimistic.author?.avatarUrl)
        // Only the server-owned fields move.
        expect(row?.id).not.toBe(optimistic.id)
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
