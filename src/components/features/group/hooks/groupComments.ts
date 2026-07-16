import type { CommentResponse } from "@/modules/api/rest/community"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/**
 * Builds the nested one-level `PostComment[]` tree the shared `PostCommentThread`
 * consumes from a BE flat comment list (`GET /community/posts/{postId}/comments`).
 *
 * The REST `CommentResponse` carries only `authorId` (no profile join), so the
 * author display name / username fall back to the author id — the same degradation
 * the group feed uses for post authors. Replies (depth ≥ 1) attach to their root
 * top-level comment via `rootId` (falling back to `parentId`).
 */
export const buildCommentTree = (
    items: Array<CommentResponse>,
    locale: string,
): Array<PostComment> => {
    const toComment = (dto: CommentResponse): PostComment => ({
        id: dto.id,
        author: dto.authorId,
        authorUsername: dto.authorId,
        text: dto.content,
        timeLabel: dto.createdAt ? formatRelativeTime(dto.createdAt, locale) : "",
    })

    const roots: Array<PostComment> = []
    const byId = new Map<string, PostComment>()

    // first pass: top-level comments (depth 0 / no parent) become roots
    for (const dto of items) {
        if (dto.depth === 0 || !dto.parentId) {
            const node: PostComment = { ...toComment(dto), replies: [] }
            byId.set(dto.id, node)
            roots.push(node)
        }
    }

    // second pass: replies attach under their root top-level comment
    for (const dto of items) {
        if (dto.depth === 0 || !dto.parentId) {
            continue
        }
        const rootId = dto.rootId ?? dto.parentId
        const root = rootId ? byId.get(rootId) : undefined
        if (root) {
            root.replies = [...(root.replies ?? []), toComment(dto)]
        } else {
            // orphan (root not in this page) — surface it as a top-level comment
            roots.push(toComment(dto))
        }
    }

    return roots
}
