import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    ReorderPinnedProjectsRequest,
    MutateReorderPinnedProjectsResponse,
} from "./types/pinned-projects"

const mutation1 = gql`
  mutation ReorderPinnedProjects($request: ReorderPinnedProjectsRequest!) {
    reorderPinnedProjects(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationReorderPinnedProjects {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReorderPinnedProjects, DocumentNode> = {
    [MutationReorderPinnedProjects.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReorderPinnedProjects}. */
export type MutateReorderPinnedProjectsParams = MutateParams<
    MutationReorderPinnedProjects,
    ReorderPinnedProjectsRequest
>

/**
 * Reorders the caller's pinned projects (array position becomes orderIndex).
 *
 * Mirrors `reorderPinnedProjects` (mutations/profile/reorder-pinned-projects).
 */
export const mutateReorderPinnedProjects = async ({
    mutation = MutationReorderPinnedProjects.Mutation1,
    request,
    debug,
    signal,
}: MutateReorderPinnedProjectsParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateReorderPinnedProjectsResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
