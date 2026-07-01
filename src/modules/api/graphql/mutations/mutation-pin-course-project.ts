import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    PinCourseProjectRequest,
    MutatePinCourseProjectResponse,
} from "./types/pinned-projects"

const mutation1 = gql`
  mutation PinCourseProject($request: PinCourseProjectRequest!) {
    pinCourseProject(request: $request) {
      success
      message
      error
      data
    }
  }
`

export enum MutationPinCourseProject {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationPinCourseProject, DocumentNode> = {
    [MutationPinCourseProject.Mutation1]: mutation1,
}

/** Apollo params for {@link mutatePinCourseProject}. */
export type MutatePinCourseProjectParams = MutateParams<
    MutationPinCourseProject,
    PinCourseProjectRequest
>

/**
 * Pins one of the caller's enrollment capstones to their public profile.
 *
 * Mirrors `pinCourseProject` (mutations/profile/pin-course-project).
 */
export const mutatePinCourseProject = async ({
    mutation = MutationPinCourseProject.Mutation1,
    request,
    debug,
    signal,
}: MutatePinCourseProjectParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutatePinCourseProjectResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
