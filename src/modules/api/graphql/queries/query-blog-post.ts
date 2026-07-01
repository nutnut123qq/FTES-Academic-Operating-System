import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryBlogPostRequest,
    QueryBlogPostResponse,
} from "./types"

const query1 = gql`
  query BlogPost($slug: String!) {
    blogPost(slug: $slug) {
      success
      message
      error
      data {
        id
        slug
        title
        excerpt
        body
        category
        coverImageUrl
        readingMinutes
        ctaUrl
        ctaLabel
        sourceUrl
        isPremium
        isLocked
        publishedAt
      }
    }
  }
`

export enum QueryBlogPost {
    Query1 = "query1",
}

const queryMap: Record<QueryBlogPost, DocumentNode> = {
    [QueryBlogPost.Query1]: query1,
}

/**
 * Fetches a single published blog article by slug for the `/blog/[slug]` page,
 * or null when no published post matches. Premium bodies are gated server-side
 * (a non-member viewer receives a truncated body with `isLocked = true`).
 *
 * Mirrors `blogPost` (queries/blog/blog-post).
 */
export const queryBlogPost = async ({
    query = QueryBlogPost.Query1,
    request,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryBlogPost, QueryBlogPostRequest>, "request"> & {
    request: QueryBlogPostRequest
}) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryBlogPostResponse>({
        query: queryMap[query],
        variables: {
            slug: request.slug,
        },
    })
}
