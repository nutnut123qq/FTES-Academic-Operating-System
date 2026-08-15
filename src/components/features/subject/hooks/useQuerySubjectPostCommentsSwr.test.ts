import { describe, expect, it } from "vitest"
import type {
    SubjectCommunityAuthor,
    SubjectCommunityCommentNode,
    SubjectCommunityReplyNode,
} from "@/modules/api/graphql/queries/query-subject-community"
import { toComment } from "./useQuerySubjectPostCommentsSwr"

/**
 * Pins the URL-facing slot of the subject discussion thread.
 *
 * The regression: this mapper degraded `authorUsername` to `author.id` when the BE row
 * carried no username. `UserLink` builds `href = /u/{username}` the moment that field is
 * non-empty, so the uuid produced a profile link that can only 404 (plus a hovercard read
 * on the same dead handle). Empty is the contract instead — the shared thread then renders
 * the name WITHOUT a link. Same guarantee the community feed/post mappers already carry.
 *
 * Fixtures mirror the live `subjectWorkspace.community` selection in
 * `query-subject-community.ts`, not an invented shape.
 */

const AUTHOR_ID = "019f3ad8-e46b-7eb1-8ebf-975795d7632e"

const author = (patch: Partial<SubjectCommunityAuthor> = {}): SubjectCommunityAuthor => ({
    id: AUTHOR_ID,
    username: "admin_test",
    displayName: "Admin Test",
    avatarUrl: "https://cdn.test/a.png",
    staffRole: "ADMIN",
    ...patch,
})

const reply = (patch: Partial<SubjectCommunityReplyNode> = {}): SubjectCommunityReplyNode => ({
    id: "c2",
    author: author(),
    body: "reply",
    createdAt: "2026-08-12T02:00:00Z",
    ...patch,
})

const comment = (patch: Partial<SubjectCommunityCommentNode> = {}): SubjectCommunityCommentNode => ({
    id: "c1",
    author: author(),
    body: "comment",
    createdAt: "2026-08-12T02:00:00Z",
    replies: [],
    ...patch,
})

describe("subject discussion comment mapper", () => {
    it("keeps the real username as the URL-facing handle", () => {
        const row = toComment(comment(), "vi")

        expect(row.authorUsername).toBe("admin_test")
        expect(row.author).toBe("Admin Test")
    })

    it("degrades to EMPTY (never the author id) when the row has no username", () => {
        const row = toComment(
            comment({
                author: author({ username: null, displayName: null }),
                replies: [reply({ author: author({ username: null, displayName: null }) })],
            }),
            "vi",
        )

        // A uuid here is a dead `/u/<uuid>` link; empty makes UserLink render name-only.
        expect(row.authorUsername).toBe("")
        expect(row.authorUsername).not.toContain(AUTHOR_ID)
        expect(row.replies?.[0]?.authorUsername).toBe("")
        expect(row.replies?.[0]?.authorUsername).not.toContain(AUTHOR_ID)
    })

    it("still carries the uploaded avatar through (the row before it in the mapper)", () => {
        const row = toComment(comment({ replies: [reply()] }), "vi")

        expect(row.authorAvatar).toBe("https://cdn.test/a.png")
        expect(row.replies?.[0]?.authorAvatar).toBe("https://cdn.test/a.png")
    })
})
