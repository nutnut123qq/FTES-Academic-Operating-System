import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryAiLabEvalResultResponse } from "./types"

const query1 = gql`
  query AiLabEvalResult($evalRunId: ID!) {
    aiLabEvalResult(evalRunId: $evalRunId) {
      success
      message
      error
      data {
        id
        evalSetId
        enrollmentId
        jobId
        submittedSystemPrompt
        submittedUserTemplate
        submittedParams {
          temperature
          topP
          maxTokens
        }
        model
        provider
        mode
        totalScore
        maxScore
        passed
        status
        caseResults {
          id
          evalCaseId
          orderIndex
          actualOutput
          metricScore
          judgeScore
          passed
          citationPresent
          feedback
        }
      }
    }
  }
`

export enum QueryAiLabEvalResult {
    Query1 = "query1",
}

const queryMap: Record<QueryAiLabEvalResult, DocumentNode> = {
    [QueryAiLabEvalResult.Query1]: query1,
}

/**
 * Fetches one eval run's grading result by id (refetched after the grading job
 * completes). Resolver takes `evalRunId` as a positional variable.
 *
 * Mirrors `aiLabEvalResult` (queries/ai-lab/ai-lab-eval-result.resolver.ts).
 */
export const queryAiLabEvalResult = async ({
    query = QueryAiLabEvalResult.Query1,
    evalRunId,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryAiLabEvalResult, never>, "request"> & {
    request?: never
    /** Eval run id to resolve the result for. */
    evalRunId: string
}) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryAiLabEvalResultResponse>({
        query: queryMap[query],
        variables: { evalRunId },
    })
}
