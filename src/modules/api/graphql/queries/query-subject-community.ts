import { createAuthApolloClient } from "../clients"
import { type GraphQLHeaders } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { FeedPostMedia } from "./query-community-feed"

/**
 * Real BE subject discussion feed — GraphQL `subjectWorkspace(subjectId).community(scope: ...)`
 * which resolves to `PostConnection!` scoped to the subject (schema.graphqls
 * `SubjectWorkspace.community`). Returns the connection directly (NO
 * `{success,message,error,data}` envelope). The posts are ordinary community posts
 * (community.api) scoped by subject, so like/comment reuse the community REST client.
 *
 * ⚠️ Gateway quirk (see query-community-feed): the pre-GraphQL security filter 401s
 * any operation that declares a NON-NULL variable (`$x: T!`). `subjectWorkspace`
 * takes `subjectId: ID!`, so the id is INLINED as a string literal (via JSON.stringify)
 * instead of being passed as a `$subjectId: ID!` variable. The same quirk applies to
 * the non-null `scope: SubjectFeedScope!` argument, so it is also INLINED as a GraphQL
 * enum literal (e.g. `community(scope: FOR_YOU)`).
 */

/** Feed scope for the subject workspace community (BE `enum SubjectFeedScope`). */
export enum SubjectFeedScope {
    ForYou = "FOR_YOU",
    Following = "FOLLOWING",
    Trending = "TRENDING",
}

/** Author attached to a discussion post or comment (BE `PublicUser`; non-PII by policy). */
export interface SubjectCommunityAuthor {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    /** Platform staff role (BE `PublicUser.staffRole`) driving the verified seal; null = member. */
    staffRole: string | null
}

/**
 * A one-level reply under a top-level comment (BE `PostComment.replies`).
 *
 * KHÔNG chọn `likeCount`/`likedByMe` ở đây, dù `PostComment` của BE có cả hai: thread bình
 * luận của tab "Thảo luận" đọc qua `useQueryPostCommentsSwr` (document khác), nên cây
 * `comments` trong document NÀY không còn ai render. Mà `likedByMe` lại là `@BatchMapping`
 * — chọn nó thêm một truy vấn `community.reactions` cho MỖI tầng, mỗi lần mở tab, để lấy
 * một giá trị không ai vẽ. Đừng thêm lại.
 */
export interface SubjectCommunityReplyNode {
    id: string
    author: SubjectCommunityAuthor
    body: string
    createdAt: string | null
}

/** A top-level comment on a post (BE `PostComment`) with its one-level replies. */
export interface SubjectCommunityCommentNode extends SubjectCommunityReplyNode {
    replies: Array<SubjectCommunityReplyNode>
}

/** One subject discussion post (BE `Post`). */
export interface SubjectCommunityPost {
    id: string
    /**
     * Author id (BE `Post.authorId`) — read straight off the post identity, so selecting it
     * costs no extra query. The shared feed card gates edit/delete on it because a display
     * name / username can be missing on a row while the id is always there.
     */
    authorId: string | null
    /**
     * Pinned by an admin (BE `Post.pinned`). Badge only, và ở feed MÔN thì nó CHỈ là badge:
     * `FeedService.subjectFeed` gọi thẳng `findSubjectFeedCursor` (`ORDER BY p.createdAt DESC,
     * p.id DESC`) và KHÔNG đi qua `mergePinned` như feed công khai / trending — bài ghim của
     * môn không được kéo lên đầu. Đừng dựa vào thứ tự trả về để suy ra "đã ghim".
     */
    pinned: boolean
    /** Post type / kind (BE `kind`, e.g. DISCUSSION / QUESTION). */
    kind: string
    title: string | null
    /** Full body (post detail); used as the card excerpt fallback. */
    body: string | null
    /** Short excerpt for the feed card (BE `snippet`, derived from body); null when empty. */
    snippet: string | null
    /** ISO timestamp (BE `DateTime`), or null. */
    createdAt: string | null
    author: SubjectCommunityAuthor
    /** Denormalized like counter (BE `likeCount`). */
    likeCount: number
    /** Whether the current viewer has reacted (BE `likedByMe`). */
    likedByMe: boolean
    /** Denormalized comment counter (BE `commentCount`). */
    commentCount: number
    /** Batch-resolved comment thread (top-level + one reply level), capped at 50/post. */
    comments: Array<SubjectCommunityCommentNode>
    /** Images attached to the post, in server order (BE `Post.media`); empty when none. */
    media: Array<FeedPostMedia>
}

/** Cursor-paginated page of posts (BE `PostConnection`). */
export interface SubjectCommunityConnection {
    items: Array<SubjectCommunityPost>
    nextCursor: string | null
}

/** Apollo response shape for `subjectWorkspace.community` (returned directly — no envelope). */
export interface QuerySubjectCommunityResponse {
    subjectWorkspace: {
        community: SubjectCommunityConnection
    } | null
}

/** Inner post/author/comment selection shared by every per-scope document. */
const COMMUNITY_SELECTION = `
  items {
    id
    authorId
    pinned
    kind
    title
    body
    snippet
    createdAt
    likeCount
    likedByMe
    commentCount
    author {
      id
      username
      displayName
      avatarUrl
      staffRole
    }
    media {
      id
      mediaType
      storageKey
      mimeType
      sortOrder
    }
    comments {
      id
      body
      createdAt
      author {
        id
        username
        displayName
        avatarUrl
        staffRole
      }
      replies {
        id
        body
        createdAt
        author {
          id
          username
          displayName
          avatarUrl
          staffRole
        }
      }
    }
  }
  nextCursor
`

/** Build the document with `subjectId` and `scope` INLINED (see the non-null-variable quirk above). */
const subjectCommunityDocument = (subjectId: string, scope: SubjectFeedScope): DocumentNode =>
    gql(
        `query SubjectCommunity {\n` +
            `  subjectWorkspace(subjectId: ${JSON.stringify(subjectId)}) {\n` +
            `    community(scope: ${scope}) {${COMMUNITY_SELECTION}\n` +
            `    }\n` +
            `  }\n` +
            `}`,
    )

/** Params for {@link querySubjectCommunity}. */
export interface QuerySubjectCommunityParams {
    subjectId: string
    /** Feed scope; defaults to FOR_YOU. */
    scope?: SubjectFeedScope
    headers?: GraphQLHeaders
    debug?: boolean
    signal?: AbortSignal
}

/**
 * Fetches the subject discussion feed via `subjectWorkspace(subjectId).community(scope: ...)`.
 * The BE requires auth (viewer-scoped visibility); a guest / error surfaces as an
 * Apollo error and the tab renders its empty/error state.
 *
 * @returns Apollo query result; the page is at `data.subjectWorkspace.community`.
 */
export const querySubjectCommunity = async ({
    subjectId,
    scope = SubjectFeedScope.ForYou,
    headers,
    debug,
    signal,
}: QuerySubjectCommunityParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QuerySubjectCommunityResponse>({
        query: subjectCommunityDocument(subjectId, scope),
    })
}
