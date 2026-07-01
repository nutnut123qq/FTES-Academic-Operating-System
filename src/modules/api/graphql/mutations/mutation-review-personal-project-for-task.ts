import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ReviewPersonalProjectTaskRequest, MutateReviewPersonalProjectTaskResponse } from "./types/review-personal-project-for-task"

const mutation1 = gql`
  mutation ReviewPersonalProjectTask($request: ReviewPersonalProjectTaskRequest!) {
    reviewPersonalProjectTask(request: $request) {
      success
      message
      error
      data {
        jobId
      }
    }
  }
`

export enum MutationReviewPersonalProjectTask {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReviewPersonalProjectTask, DocumentNode> = {
    [MutationReviewPersonalProjectTask.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReviewPersonalProjectTask}. */
export type MutateReviewPersonalProjectTaskParams = MutateParams<
    MutationReviewPersonalProjectTask,
    ReviewPersonalProjectTaskRequest
>

/**
 * Queues AI review for a personal project repository of one task.
 */
export const mutateReviewPersonalProjectTask = async ({
    mutation = MutationReviewPersonalProjectTask.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateReviewPersonalProjectTaskParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateReviewPersonalProjectTaskResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
