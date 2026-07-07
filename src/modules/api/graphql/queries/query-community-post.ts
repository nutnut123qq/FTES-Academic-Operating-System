import { createAuthApolloClient } from "../clients"
import { type GraphQLOperationContext, type GraphQLHeaders } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { FeedPost } from "./query-community-feed"

/**
 * Real BE `post(id: ID!): Post` (schema.graphqls) — a single community post, returned
 * directly (NO envelope). Same minimal `Post` shape as the feed: id/kind/title/createdAt +
 * batched `author`, with NO body/likes/comments (those degrade in the detail view).
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
            `    author { id username displayName avatarUrl }\n` +
            `  }\n}`,
    )

/** Apollo response shape for `post` (returned directly — no envelope; null when not found). */
export interface QueryCommunityPostResponse {
    post: FeedPost | null
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
