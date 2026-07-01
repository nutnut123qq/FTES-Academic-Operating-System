import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    UnpinProjectRequest,
    MutateUnpinProjectResponse,
} from "./types/pinned-projects"

const mutation1 = gql`
  mutation UnpinProject($request: UnpinProjectRequest!) {
    unpinProject(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationUnpinProject {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationUnpinProject, DocumentNode> = {
    [MutationUnpinProject.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateUnpinProject}. */
export type MutateUnpinProjectParams = MutateParams<
    MutationUnpinProject,
    UnpinProjectRequest
>

/**
 * Removes one of the caller's pinned projects.
 *
 * Mirrors `unpinProject` (mutations/profile/unpin-project).
 */
export const mutateUnpinProject = async ({
    mutation = MutationUnpinProject.Mutation1,
    request,
    debug,
    signal,
}: MutateUnpinProjectParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateUnpinProjectResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
