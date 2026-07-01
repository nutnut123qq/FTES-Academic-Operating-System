import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryAiLabPlaygroundResponse } from "./types"

const query1 = gql`
  query AiLabPlayground($contentId: ID!) {
    aiLabPlayground(contentId: $contentId) {
      success
      message
      error
      data {
        id
        contentId
        slug
        kind
        defaultSystemPrompt
        defaultUserPrompt
        defaultParams {
          temperature
          topP
          maxTokens
        }
        allowedProviders
        maxRunsPerWindow
        ragCollectionSlug
        defaultLocale
        translations {
          locale
          field
          value
        }
      }
    }
  }
`

export enum QueryAiLabPlayground {
    Query1 = "query1",
}

const queryMap: Record<QueryAiLabPlayground, DocumentNode> = {
    [QueryAiLabPlayground.Query1]: query1,
}

/**
 * Fetches the AI Lab playground bound to one lesson content, or null when the
 * lesson has no playground. The backend resolver takes the `contentId` as a
 * positional variable (not a `request` wrapper).
 *
 * Mirrors `aiLabPlayground` (queries/ai-lab/ai-lab-playground.resolver.ts).
 */
export const queryAiLabPlayground = async ({
    query = QueryAiLabPlayground.Query1,
    contentId,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryAiLabPlayground, never>, "request"> & {
    request?: never
    /** Lesson content id to resolve the playground for. */
    contentId: string
}) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryAiLabPlaygroundResponse>({
        query: queryMap[query],
        variables: { contentId },
    })
}
