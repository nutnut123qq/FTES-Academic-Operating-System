import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ProcessCVRequest, MutateProcessCVResponse } from "./types/process-cv"

const mutation1 = gql`
  mutation ProcessCV($request: ProcessCVRequest!) {
    processCV(request: $request) {
      success
      message
      error
      data {
        jobId
        status
      }
    }
  }
`

export enum MutationProcessCV {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationProcessCV, DocumentNode> = {
    [MutationProcessCV.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateProcessCV}. */
export type MutateProcessCVParams = MutateParams<MutationProcessCV, ProcessCVRequest>

/**
 * Processes the uploaded CV file (parsing, extraction, etc.).
 *
 * Mirrors `ref/cv-upload/process-cv.resolver.ts` (`processCV`).
 */
export const mutateProcessCV = async ({
    mutation = MutationProcessCV.Mutation1,
    request,
    debug,
    signal,
}: MutateProcessCVParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateProcessCVResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
