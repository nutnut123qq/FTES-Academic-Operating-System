import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryBlogPostsRequest,
    QueryBlogPostsResponse,
} from "./types"

const query1 = gql`
  query BlogPosts($category: BlogCategory, $limit: Int, $offset: Int) {
    blogPosts(category: $category, limit: $limit, offset: $offset) {
      success
      message
      error
      data {
        id
        slug
        title
        excerpt
        category
        coverImageUrl
        readingMinutes
        isPremium
        publishedAt
      }
    }
  }
`

export enum QueryBlogPosts {
    Query1 = "query1",
}

const queryMap: Record<QueryBlogPosts, DocumentNode> = {
    [QueryBlogPosts.Query1]: query1,
}

/**
 * Fetches published blog posts (newest first) for the `/blog` listing,
 * optionally filtered by editorial pillar. Body is omitted (detail query fetches
 * it).
 *
 * Mirrors `blogPosts` (queries/blog/blog-posts).
 */
export const queryBlogPosts = async ({
    query = QueryBlogPosts.Query1,
    request,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryBlogPosts, QueryBlogPostsRequest>, "request"> & {
    request?: QueryBlogPostsRequest
}) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryBlogPostsResponse>({
        query: queryMap[query],
        variables: {
            category: request?.category,
            limit: request?.limit,
            offset: request?.offset,
        },
    })
}
