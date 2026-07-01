import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ReviewFlashcardRequest, MutateReviewFlashcardResponse } from "./types/review-flashcard"

const mutation1 = gql`
  mutation ReviewFlashcard($request: ReviewFlashcardRequest!) {
    reviewFlashcard(request: $request) {
      success
      message
      error
      data {
        dueAt
      }
    }
  }
`

export enum MutationReviewFlashcard {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReviewFlashcard, DocumentNode> = {
    [MutationReviewFlashcard.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReviewFlashcard}. */
export type MutateReviewFlashcardParams = MutateParams<
    MutationReviewFlashcard,
    ReviewFlashcardRequest
>

/**
 * Grades a flashcard review (SM-2): records the recall quality and reschedules
 * the card. Mirrors `reviewFlashcard` (mutations/flashcards/review-flashcard).
 */
export const mutateReviewFlashcard = async ({
    mutation = MutationReviewFlashcard.Mutation1,
    request,
    debug,
    signal,
}: MutateReviewFlashcardParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateReviewFlashcardResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
