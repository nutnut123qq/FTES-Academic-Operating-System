import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { GroupThreadCommentDto } from "@/modules/api/rest/group"
import type { FeedPost } from "@/modules/api/graphql/queries/query-community-feed"
import type {
    CommunityPostCommentNode,
    CommunityPostNode,
} from "@/modules/api/graphql/queries/query-community-post"
import { toCommunityPost } from "./useQueryCommunityFeedSwr"
import { toComment, toPostDetail } from "./useQueryPostDetailSwr"
import { buildThreadCommentTree } from "@/components/features/group/hooks/useQueryGroupThreadCommentsSwr"

/**
 * The pinned THÀNH TÍCH crossing every producer of a community author row.
 *
 * `PostComment` / `CommunityPost` are built by FOUR different mappers off TWO
 * transports, and a field added to three of them is invisible on the fourth — the
 * group thread's REST builder is exactly the surface that would have stayed blank.
 * All of them are pinned here together, in one file, so the next person adding an
 * author field sees the full set instead of discovering it one bug at a time.
 *
 * The other half is the QUERY: the backend lane found that `avatarFrame` had been
 * `null` on this whole path since V341 because the resolver never filled it, even
 * though the frontend had been selecting it correctly all along. The inverse failure
 * — a mapper that reads a field the document never asked for — is just as silent, so
 * the selection sets are asserted directly.
 */

const ACHIEVEMENT = {
    code: "FIRST_LESSON",
    name: "Bài học đầu tiên",
    iconUrl: "https://cdn.example/first-lesson.png",
}

const QUERIES = join(process.cwd(), "src", "modules", "api", "graphql", "queries")

/**
 * The selection as it reads once newlines and `\n` + `+` string joins collapse — both
 * documents are built from template/concatenated strings, so normalising whitespace is
 * what lets ONE needle pin both spellings without pinning their formatting.
 */
const SELECTION = "staffRole avatarFrame equippedAchievement { code name iconUrl }"

describe("the query documents actually ASK for the pinned achievement", () => {
    it.each([
        ["query-community-feed.ts", 1],
        ["query-community-post.ts", 3],
    ])("%s selects it on every author card (%i)", (file, expected) => {
        const source = readFileSync(join(QUERIES, file), "utf8")
            .replace(/\\n/g, " ")
            .replace(/["'`+]/g, " ")
            .replace(/\s+/g, " ")
        expect(source.split(SELECTION).length - 1).toBe(expected)
    })
})

describe("every producer of an author row carries the pinned achievement", () => {
    it("feed rows — toCommunityPost", () => {
        const post = { id: "p1", author: { equippedAchievement: ACHIEVEMENT } } as unknown as FeedPost
        expect(toCommunityPost(post, "vi").authorAchievement).toEqual(ACHIEVEMENT)
    })

    it("post detail — toPostDetail", () => {
        const node = {
            id: "p1",
            comments: [],
            author: { equippedAchievement: ACHIEVEMENT },
        } as unknown as CommunityPostNode
        expect(toPostDetail(node, "vi").authorAchievement).toEqual(ACHIEVEMENT)
    })

    it("comments AND their replies — toComment", () => {
        const node = {
            id: "c1",
            body: "hi",
            author: { equippedAchievement: ACHIEVEMENT },
            replies: [{ id: "r1", body: "re", author: { equippedAchievement: ACHIEVEMENT } }],
        } as unknown as CommunityPostCommentNode
        const mapped = toComment(node, "vi")
        expect(mapped.authorAchievement).toEqual(ACHIEVEMENT)
        expect(mapped.replies?.[0]?.authorAchievement).toEqual(ACHIEVEMENT)
    })

    it("group thread comments — buildThreadCommentTree, the SECOND builder of PostComment", () => {
        const dto = {
            id: "c1",
            depth: 0,
            parentId: null,
            content: "hi",
            author: { userId: "u1", equippedAchievement: ACHIEVEMENT },
        } as unknown as GroupThreadCommentDto
        expect(buildThreadCommentTree([dto], "vi")[0]?.authorAchievement).toEqual(ACHIEVEMENT)
    })

    it("degrades to null on every producer when the author card carries nothing", () => {
        const bare = { author: {} }
        expect(toCommunityPost({ id: "p", ...bare } as unknown as FeedPost, "vi").authorAchievement)
            .toBeNull()
        expect(
            toPostDetail({ id: "p", comments: [], ...bare } as unknown as CommunityPostNode, "vi")
                .authorAchievement,
        ).toBeNull()
        expect(
            toComment({ id: "c", body: "", replies: [], ...bare } as unknown as CommunityPostCommentNode, "vi")
                .authorAchievement,
        ).toBeNull()
        expect(
            buildThreadCommentTree(
                [{ id: "c", depth: 0, parentId: null, content: "", ...bare } as unknown as GroupThreadCommentDto],
                "vi",
            )[0]?.authorAchievement,
        ).toBeNull()
    })
})
