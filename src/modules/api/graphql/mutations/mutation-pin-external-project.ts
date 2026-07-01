import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    PinExternalProjectRequest,
    MutatePinExternalProjectResponse,
} from "./types/pinned-projects"

const mutation1 = gql`
  mutation PinExternalProject($request: PinExternalProjectRequest!) {
    pinExternalProject(request: $request) {
      success
      message
      error
      data
    }
  }
`

export enum MutationPinExternalProject {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationPinExternalProject, DocumentNode> = {
    [MutationPinExternalProject.Mutation1]: mutation1,
}

/** Apollo params for {@link mutatePinExternalProject}. */
export type MutatePinExternalProjectParams = MutateParams<
    MutationPinExternalProject,
    PinExternalProjectRequest
>

/**
 * Pins a free-form external project to the caller's public profile.
 *
 * Mirrors `pinExternalProject` (mutations/profile/pin-external-project).
 */
export const mutatePinExternalProject = async ({
    mutation = MutationPinExternalProject.Mutation1,
    request,
    debug,
    signal,
}: MutatePinExternalProjectParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutatePinExternalProjectResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
