import { describe, expect, it } from "vitest"
import type { GroupThreadCommentDto, GroupThreadDto } from "@/modules/api/rest/group"
import { toGroupThread } from "./useQueryGroupThreadsSwr"
import { buildThreadCommentTree } from "./useQueryGroupThreadCommentsSwr"

/**
 * Pins the author card onto the group discussion surfaces.
 *
 * The regression these guard against actually shipped: both mappers read `authorId` into
 * the NAME slot, so every thread and every comment in a group was signed with a raw uuid
 * while the backend had been sending a real profile card all along. The fixtures below are
 * the live apitest payload (group `a1b20000-…-0001`), not invented shapes.
 */

/** Live payload: a thread authored by a platform ADMIN. */
const thread = (patch: Partial<GroupThreadDto> = {}): GroupThreadDto => ({
    id: "d0000000-0000-4000-8000-000000000001",
    groupId: "a1b20000-0000-4000-8000-000000000001",
    authorId: "019f3ad8-e46b-7eb1-8ebf-975795d7632e",
    title: "Thread",
    content: "body",
    replyCount: 1,
    likeCount: 0,
    likedByMe: false,
    lastActivityAt: "2026-08-12T02:00:00Z",
    createdAt: "2026-08-12T02:00:00Z",
    author: {
        userId: "019f3ad8-e46b-7eb1-8ebf-975795d7632e",
        username: "admin_test",
        displayName: "Admin Test",
        avatarUrl: null,
        staffRole: "ADMIN",
    },
    ...patch,
})

const comment = (patch: Partial<GroupThreadCommentDto> = {}): GroupThreadCommentDto => ({
    id: "d1000000-0000-4000-8000-000000000001",
    threadId: "d0000000-0000-4000-8000-000000000001",
    authorId: "019f3ad8-e46b-7eb1-8ebf-975795d7632e",
    parentId: null,
    rootId: null,
    depth: 0,
    content: "comment",
    likeCount: 0,
    likedByMe: false,
    createdAt: "2026-08-12T02:00:00Z",
    author: {
        userId: "019f3ad8-e46b-7eb1-8ebf-975795d7632e",
        username: "admin_test",
        displayName: "Admin Test",
        avatarUrl: null,
        staffRole: "ADMIN",
    },
    ...patch,
})

describe("group thread author card", () => {
    it("reads the name off the card, never the author id", () => {
        const row = toGroupThread(thread(), "vi")
        expect(row.author).toBe("Admin Test")
        expect(row.authorUsername).toBe("admin_test")
        expect(row.authorStaffRole).toBe("ADMIN")
        // The whole point: no uuid anywhere near the rendered identity.
        expect(row.author).not.toContain(thread().authorId)
        expect(row.authorUsername).not.toContain(thread().authorId)
    })

    it("falls back to the username when the profile has no display name", () => {
        const row = toGroupThread(
            thread({
                author: {
                    userId: "u1",
                    username: "ctv_test",
                    displayName: null,
                    avatarUrl: null,
                    staffRole: null,
                },
            }),
            "vi",
        )
        expect(row.author).toBe("ctv_test")
        expect(row.authorStaffRole).toBeNull()
    })

    it("degrades to EMPTY (not the id) when the backend sent no card", () => {
        const row = toGroupThread(thread({ author: null }), "vi")
        expect(row.author).toBe("")
        expect(row.authorUsername).toBe("")
        expect(row.authorAvatar).toBeNull()
        expect(row.authorStaffRole).toBeNull()
    })
})

describe("group thread comment tree", () => {
    it("carries the card onto REPLIES too, not just root comments", () => {
        // Mirrors the live thread: two ordinary members at depth 0, an ADMIN reply at depth 1.
        const roots = buildThreadCommentTree(
            [
                comment({
                    id: "c1",
                    author: {
                        userId: "u2",
                        username: "instructor_test",
                        displayName: "Instructor Test",
                        avatarUrl: null,
                        staffRole: null,
                    },
                }),
                comment({
                    id: "c2",
                    depth: 1,
                    parentId: "c1",
                    rootId: "c1",
                }),
            ],
            "vi",
        )

        expect(roots).toHaveLength(1)
        expect(roots[0].author).toBe("Instructor Test")
        expect(roots[0].authorStaffRole).toBeNull()

        const reply = roots[0].replies?.[0]
        expect(reply?.author).toBe("Admin Test")
        expect(reply?.authorUsername).toBe("admin_test")
        expect(reply?.authorStaffRole).toBe("ADMIN")
    })

    it("never puts the author id in the name or username slot", () => {
        const [row] = buildThreadCommentTree([comment({ author: null })], "vi")
        expect(row.author).toBe("")
        expect(row.authorUsername).toBe("")
    })
})
