import { describe, expect, it } from "vitest"
import type { PostResponse } from "@/modules/api/rest/community"
import {
    toMyCommunityPost,
    toMyCommunitySummaryCounters,
} from "./useQueryMyCommunitySummarySwr"

/**
 * Unit — the profile Community tab mapping over `GET /community/search?author=<me>`.
 *
 * Regression guard: the tab used to hardcode `recentPosts: []` and zero counters. These
 * tests pin the real mapping, including the two shapes the BE actually returns — a
 * body-only post (community posts need no title) and a post with no `createdAt`.
 */

const post = (overrides: Partial<PostResponse> = {}): PostResponse => ({
    id: "p1",
    authorId: "u1",
    postType: "DISCUSSION",
    title: "Kafka poison pill",
    content: "Consumer kẹt ở offset 0",
    status: "PUBLISHED",
    likeCount: 3,
    commentCount: 2,
    shareCount: 0,
    voteScore: 0,
    createdAt: "2026-07-20T10:00:00Z",
    ...overrides,
})

describe("toMyCommunityPost", () => {
    it("maps id / title / engagement and formats the date in the active locale", () => {
        const mapped = toMyCommunityPost(post(), "vi", "Không tiêu đề")
        expect(mapped.id).toBe("p1")
        expect(mapped.title).toBe("Kafka poison pill")
        expect(mapped.likeCount).toBe(3)
        expect(mapped.commentCount).toBe(2)
        expect(mapped.dateLabel).toContain("2026")
    })

    it("falls back to a body excerpt for a body-only post", () => {
        const mapped = toMyCommunityPost(
            post({ title: undefined, content: "  Ai biết cách reset offset không?  " }),
            "vi",
            "Không tiêu đề",
        )
        expect(mapped.title).toBe("Ai biết cách reset offset không?")
    })

    it("falls back to the translated untitled label when title AND body are empty", () => {
        const mapped = toMyCommunityPost(post({ title: "   ", content: "" }), "vi", "Không tiêu đề")
        expect(mapped.title).toBe("Không tiêu đề")
    })

    it("renders an empty date line instead of 'Invalid Date' when createdAt is missing/bad", () => {
        expect(toMyCommunityPost(post({ createdAt: undefined }), "vi", "x").dateLabel).toBe("")
        expect(toMyCommunityPost(post({ createdAt: "not-a-date" }), "vi", "x").dateLabel).toBe("")
    })
})

describe("toMyCommunitySummaryCounters", () => {
    it("counts posts and sums the comments / reactions they received", () => {
        expect(
            toMyCommunitySummaryCounters([
                post({ id: "a", likeCount: 3, commentCount: 2 }),
                post({ id: "b", likeCount: 5, commentCount: 0 }),
            ]),
        ).toEqual({ posts: 2, comments: 2, reactions: 8 })
    })

    it("is all-zero (not NaN) for a viewer with no posts or missing counters", () => {
        expect(toMyCommunitySummaryCounters([])).toEqual({ posts: 0, comments: 0, reactions: 0 })
        expect(
            toMyCommunitySummaryCounters([
                { ...post(), likeCount: undefined as unknown as number, commentCount: undefined as unknown as number },
            ]),
        ).toEqual({ posts: 1, comments: 0, reactions: 0 })
    })
})
