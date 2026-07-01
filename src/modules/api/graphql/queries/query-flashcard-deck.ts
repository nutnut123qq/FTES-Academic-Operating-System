import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryFlashcardDeckResponse } from "./types"

const query1 = gql`
  query FlashcardDeck($flashcardDeckId: ID!) {
    flashcardDeck(flashcardDeckId: $flashcardDeckId) {
      success
      message
      error
      data {
        id
        displayId
        title
        description
        difficulty
        sortIndex
        defaultLocale
        cards {
          id
          question
          answer
          explanation
          level
          tags
          sortIndex
          defaultLocale
          isPremium
        }
        contents {
          id
          displayId
          title
          module {
            id
            displayId
          }
        }
        modules {
          id
          displayId
          title
        }
      }
    }
  }
`

export enum QueryFlashcardDeck {
    Query1 = "query1",
}

const queryMap: Record<QueryFlashcardDeck, DocumentNode> = {
    [QueryFlashcardDeck.Query1]: query1,
}

/** Request body for the flashcard deck query. */
export interface FlashcardDeckRequest {
    /** The deck id to fetch. */
    flashcardDeckId: string
}

/**
 * One flashcard deck by id, with its open-ended Q&A cards.
 */
export const queryFlashcardDeck = async ({
    query = QueryFlashcardDeck.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryFlashcardDeck, FlashcardDeckRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryFlashcardDeckResponse>({
        query: queryMap[query],
        variables: {
            flashcardDeckId: request?.flashcardDeckId,
        },
    })
}
