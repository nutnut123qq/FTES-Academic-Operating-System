import { createAuthApolloClient } from "../clients"
import { type GraphQLHeaders } from "../types"
import { DocumentNode, gql } from "@apollo/client"

/**
 * Real BE subject discussion feed — GraphQL `subjectWorkspace(subjectId).community`
 * which resolves to `PostConnection!` scoped to the subject (schema.graphqls
 * `SubjectWorkspace.community`). Returns the connection directly (NO
 * `{success,message,error,data}` envelope). The posts are ordinary community posts
 * (community.api) scoped by subject, so like/comment reuse the community REST client.
 *
 * ⚠️ Gateway quirk (see query-community-feed): the pre-GraphQL security filter 401s
 * any operation that declares a NON-NULL variable (`$x: T!`). `subjectWorkspace`
 * takes `subjectId: ID!`, so the id is INLINED as a string literal (via JSON.stringify)
 * instead of being passed as a `$subjectId: ID!` variable.
 */

/** Author attached to a discussion post (BE `PublicUser`; non-PII by policy). */
export interface SubjectCommunityAuthor {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
}

/** One subject discussion post (BE `Post`). */
export interface SubjectCommunityPost {
    id: string
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

/** Post/author selection under the `community` field. */
const COMMUNITY_SELECTION = `
  community {
    items {
      id
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
      }
    }
    nextCursor
  }
`

/** Build the document with `subjectId` INLINED (see the non-null-variable quirk above). */
const subjectCommunityDocument = (subjectId: string): DocumentNode =>
    gql(
        `query SubjectCommunity {\n` +
            `  subjectWorkspace(subjectId: ${JSON.stringify(subjectId)}) {${COMMUNITY_SELECTION}}\n` +
            `}`,
    )

/** Params for {@link querySubjectCommunity}. */
export interface QuerySubjectCommunityParams {
    subjectId: string
    headers?: GraphQLHeaders
    debug?: boolean
    signal?: AbortSignal
}

/**
 * Fetches the subject discussion feed via `subjectWorkspace(subjectId).community`.
 * The BE requires auth (viewer-scoped visibility); a guest / error surfaces as an
 * Apollo error and the tab renders its empty/error state.
 *
 * @returns Apollo query result; the page is at `data.subjectWorkspace.community`.
 */
export const querySubjectCommunity = async ({
    subjectId,
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
        query: subjectCommunityDocument(subjectId),
    })
}
