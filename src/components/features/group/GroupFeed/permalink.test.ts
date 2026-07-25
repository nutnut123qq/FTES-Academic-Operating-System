import { describe, expect, it } from "vitest"
import { groupPostPermalink } from "./permalink"

/**
 * Unit — the group feed share URL.
 *
 * The share action used to hand out the GROUP url (`/{locale}/groups/{groupId}`) for
 * every post, so every share pointed at the same feed. A group post is a community
 * post, so the permalink is the post detail route.
 */
describe("groupPostPermalink", () => {
    it("builds the community post permalink, not the group url", () => {
        expect(groupPostPermalink("vi", "post-1", "https://ftes.vn")).toBe(
            "https://ftes.vn/vi/community/post-1",
        )
    })

    it("keeps the active locale segment", () => {
        expect(groupPostPermalink("en", "post-2", "https://ftes.vn")).toBe(
            "https://ftes.vn/en/community/post-2",
        )
    })

    it("returns an empty string when there is no origin (SSR) or no post", () => {
        expect(groupPostPermalink("vi", "post-1", "")).toBe("")
        expect(groupPostPermalink("vi", "", "https://ftes.vn")).toBe("")
    })
})
