import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    GradeInterviewAnswerRequest,
    MutateGradeInterviewAnswerResponse,
} from "./types/grade-interview-answer"

const mutation1 = gql`
  mutation GradeInterviewAnswer($request: GradeInterviewAnswerRequest!) {
    gradeInterviewAnswer(request: $request) {
      success
      message
      error
      data {
        score
        verdict
        strengths
        gaps
        modelAnswerHint
        followUpQuestion
      }
    }
  }
`

export enum MutationGradeInterviewAnswer {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationGradeInterviewAnswer, DocumentNode> = {
    [MutationGradeInterviewAnswer.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateGradeInterviewAnswer}. */
export type MutateGradeInterviewAnswerParams = MutateParams<
    MutationGradeInterviewAnswer,
    GradeInterviewAnswerRequest
>

/**
 * Grades a candidate's transcribed interview answer against the card's model
 * answer. Stateless — nothing is persisted. Returns a 0–100 score, a
 * pass/borderline/fail verdict, and concrete strengths/gaps feedback.
 *
 * Mirrors backend `mutations/interview/grade-interview-answer`.
 */
export const mutateGradeInterviewAnswer = async ({
    mutation = MutationGradeInterviewAnswer.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateGradeInterviewAnswerParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateGradeInterviewAnswerResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
