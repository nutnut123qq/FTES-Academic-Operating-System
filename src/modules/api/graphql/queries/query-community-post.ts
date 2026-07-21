import { createAuthApolloClient } from "../clients"
import { type GraphQLOperationContext, type GraphQLHeaders } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { FeedPostAuthor, FeedPostMedia } from "./query-community-feed"

/**
 * Real BE `post(id: ID!): Post` (schema.graphqls) — a single community post, returned
 * directly (NO envelope). Unlike the feed's minimal row, this selection is the enriched
 * detail `Post`: id/kind/title/createdAt + batched `author`, PLUS the full `body`, the
 * `likeCount`/`likedByMe`/`commentCount` engagement, and the batch-resolved `comments`
 * thread (top-level + one reply level) — mirroring the {@link CommunityPostNode} shape.
 *
 * ⚠️ Gateway quirk (verified against apitest): the pre-GraphQL security filter 401s ANY
 * operation that declares a NON-NULL variable (`$id: ID!`). But `post`'s arg is `ID!`, so a
 * nullable `$id: ID` variable is rejected by GraphQL validation (VariableTypeMismatch). The
 * only working shape is therefore to INLINE the id as a string literal (no variables) — the
 * same tactic the feed uses for its `tab` enum. The id is `JSON.stringify`-escaped so an
 * arbitrary URL param can never break out of the string literal (no GraphQL injection).
 *
 * A non-existent / not-visible id returns a `COMMUNITY_POST_NOT_FOUND` GraphQL error
 * (surfaced as an Apollo error), so the caller degrades to "no post".
 */
const postDocument = (id: string): DocumentNode =>
    gql(
        `query CommunityPost {\n` +
            `  post(id: ${JSON.stringify(id)}) {\n` +
            `    id\n    kind\n    title\n    createdAt\n` +
            `    body\n    likeCount\n    likedByMe\n    commentCount\n` +
            `    media { id mediaType storageKey mimeType sortOrder }\n` +
            `    author { id username displayName avatarUrl }\n` +
            `    comments {\n` +
            `      id\n      body\n      createdAt\n      parentCommentId\n` +
            `      author { id username displayName avatarUrl }\n` +
            `      replies {\n` +
            `        id\n        body\n        createdAt\n` +
            `        author { id username displayName avatarUrl }\n` +
            `      }\n` +
            `    }\n` +
            `  }\n}`,
    )

/**
 * A one-level reply under a top-level comment (BE `PostComment.replies`, capped at 2
 * levels server-side so replies carry no further `replies`).
 */
export interface CommunityPostReplyNode {
    id: string
    author: FeedPostAuthor
    body: string
    createdAt: string | null
}

/** A top-level comment on a post (BE `PostComment`) with its one-level replies. */
export interface CommunityPostCommentNode extends CommunityPostReplyNode {
    parentCommentId: string | null
    replies: Array<CommunityPostReplyNode>
}

/**
 * A single community post with the READ-only detail enrichment: full `body`, the
 * `likeCount`/`likedByMe`/`commentCount` engagement, and the batch-resolved `comments`
 * thread (top-level + one reply level).
 */
export interface CommunityPostNode {
    id: string
    kind: string
    title: string | null
    createdAt: string | null
    author: FeedPostAuthor
    body: string | null
    likeCount: number
    likedByMe: boolean
    commentCount: number
    comments: Array<CommunityPostCommentNode>
    /** Images attached to the post, in server order; empty when none. */
    media: Array<FeedPostMedia>
}

/** Apollo response shape for `post` (returned directly — no envelope; null when not found). */
export interface QueryCommunityPostResponse {
    post: CommunityPostNode | null
}

/** Params for {@link queryCommunityPost}. */
export interface QueryCommunityPostParams extends GraphQLOperationContext {
    /** The post id (uuid). */
    id: string
    headers?: GraphQLHeaders
    debug?: boolean
}

/**
 * Fetches a single community post by id. Requires auth (viewer-scoped visibility).
 *
 * @returns Apollo query result; the post is at `data.post` (null / Apollo error when
 * missing or not visible to the viewer).
 */
export const queryCommunityPost = async ({
    id,
    headers,
    debug,
    signal,
}: QueryCommunityPostParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryCommunityPostResponse>({
        query: postDocument(id),
    })
}
