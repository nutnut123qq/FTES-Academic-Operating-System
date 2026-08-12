import { describe, expect, it } from "vitest"
import type { FeedPostAuthor } from "@/modules/api/graphql/queries/query-community-feed"
import type {
    CommunityPostCommentNode,
    CommunityPostReplyNode,
} from "@/modules/api/graphql/queries/query-community-post"
import { toComment } from "./useQueryPostDetailSwr"

/**
 * Pins the author card onto every comment read through GraphQL `post(id)`.
 *
 * The regression these guard against actually shipped on the GROUP feed (change
 * `group-post-comments-graphql`): that surface read its comments from REST
 * `GET /community/posts/{postId}/comments`, whose `CommentResponse` carries only
 * `authorId`, so the mapper put a raw uuid in BOTH the name and the username slot —
 * comments signed with a uuid, profile links that could only 404, no avatar. The fix
 * routes the group feed through THIS mapper, which is why the group surface now depends
 * on the guarantees below.
 *
 * Fixtures mirror the live `post(id)` selection in `query-community-post.ts`
 * (`comments { id body createdAt parentCommentId author {…} replies { id body createdAt
 * author {…} } }`), not an invented shape.
 */

const AUTHOR_ID = "019f3ad8-e46b-7eb1-8ebf-975795d7632e"

const author = (patch: Partial<FeedPostAuthor> = {}): FeedPostAuthor => ({
    id: AUTHOR_ID,
    username: "admin_test",
    displayName: "Admin Test",
    avatarUrl: null,
    staffRole: "ADMIN",
    ...patch,
})

const reply = (patch: Partial<CommunityPostReplyNode> = {}): CommunityPostReplyNode => ({
    id: "c2",
    author: author(),
    body: "reply",
    createdAt: "2026-08-12T02:00:00Z",
    ...patch,
})

const comment = (patch: Partial<CommunityPostCommentNode> = {}): CommunityPostCommentNode => ({
    id: "c1",
    author: author({
        id: "019f3ad8-0000-4000-8000-000000000002",
        username: "instructor_test",
        displayName: "Instructor Test",
        staffRole: null,
    }),
    body: "comment",
    createdAt: "2026-08-12T02:00:00Z",
    parentCommentId: null,
    replies: [],
    ...patch,
})

/**
 * The gateway batch-resolves `author` and may hand back NULL for a user with no profile
 * row — the schema types it non-null, so the wire reality needs the cast. The mapper
 * optional-chains every read precisely because of this case.
 */
const NO_CARD = null as unknown as FeedPostAuthor

describe("post(id) comment mapper", () => {
    it("reads the name off the card, never the author id", () => {
        const row = toComment(comment(), "vi")

        expect(row.author).toBe("Instructor Test")
        expect(row.authorUsername).toBe("instructor_test")
        expect(row.authorStaffRole).toBeNull()
        // The whole point: no uuid anywhere near the rendered identity.
        expect(row.author).not.toContain("019f3ad8")
        expect(row.authorUsername).not.toContain("019f3ad8")
    })

    it("falls back to the username when the profile has no display name", () => {
        const row = toComment(comment({ author: author({ displayName: null }) }), "vi")

        expect(row.author).toBe("admin_test")
    })

    it("carries the card onto REPLIES too, staffRole included", () => {
        const row = toComment(comment({ replies: [reply()] }), "vi")

        const child = row.replies?.[0]
        expect(child?.author).toBe("Admin Test")
        expect(child?.authorUsername).toBe("admin_test")
        // The verified seal only renders when the reply keeps its role — the old REST
        // path had no staffRole at all, so admins replied as anonymous uuids.
        expect(child?.authorStaffRole).toBe("ADMIN")
        expect(child?.author).not.toContain(AUTHOR_ID)
    })

    it("degrades to EMPTY (not the id) when the gateway sent no author card", () => {
        const row = toComment(comment({ author: NO_CARD, replies: [reply({ author: NO_CARD })] }), "vi")

        expect(row.author).toBe("")
        expect(row.authorUsername).toBe("")
        expect(row.authorAvatar).toBeNull()
        expect(row.authorStaffRole).toBeNull()

        const child = row.replies?.[0]
        expect(child?.author).toBe("")
        expect(child?.authorUsername).toBe("")
    })

    it("keeps the body and drops an unusable timestamp instead of printing Invalid Date", () => {
        const row = toComment(comment({ body: "xin chào", createdAt: null }), "vi")

        expect(row.text).toBe("xin chào")
        expect(row.timeLabel).toBe("")
    })
})
