import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryChallengeResponse, ChallengeRequest } from "./types"

const query1 = gql`
  query Challenge($request: ChallengeRequest!) {
    challenge(request: $request) {
      success
      message
      error
      data {
        id
        title
        description
        score
        difficulty
        sortIndex
        submissions {
          id
          type
          title
          description
          sortIndex
          userSubmission {
            submissionUrl
          }
        }
        verified
        defaultLocale
        requirements {
          id
          sortIndex
          defaultLocale
          langs {
            id
            lang
            sortIndex
            score
            defaultLocale
            title
            body
          }
        }
        steps {
          id
          sortIndex
          defaultLocale
          langs {
            id
            lang
            sortIndex
            defaultLocale
            title
            body
          }
        }
        outputs {
          id
          sortIndex
          defaultLocale
          langs {
            id
            lang
            sortIndex
            defaultLocale
            text
          }
        }
        prerequisites {
          id
          sortIndex
          defaultLocale
          langs {
            id
            lang
            sortIndex
            defaultLocale
            text
          }
        }
      }
    }
  }
`

export enum QueryChallenge {
    Query1 = "query1",
}

const queryMap: Record<QueryChallenge, DocumentNode> = {
    [QueryChallenge.Query1]: query1,
}

/**
 * One challenge by id with requirements, steps, outputs, prerequisites
 * (criteria-based per-language schema).
 */
export const queryChallenge = async ({
    query = QueryChallenge.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryChallenge, ChallengeRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    }
    )
    return apollo.query<QueryChallengeResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
