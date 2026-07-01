import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { CreateCommunityPostRequest, MutateCreateCommunityPostResponse } from "./types/community"

const mutation1 = gql`
  mutation CreateCommunityPost($request: CreateCommunityPostRequest!) {
    createCommunityPost(request: $request) {
      success
      message
      error
      data {
        id
        body
        channel
        isPinned
        editedAt
        createdAt
        author {
          id
          username
          displayName
          avatar
        }
        commentCount
        reactions {
          total
          myReaction
        }
        isMine
        isFounderAuthor
      }
    }
  }
`

export enum MutationCreateCommunityPost {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationCreateCommunityPost, DocumentNode> = {
    [MutationCreateCommunityPost.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateCreateCommunityPost}. */
export type MutateCreateCommunityPostParams = MutateParams<
    MutationCreateCommunityPost,
    CreateCommunityPostRequest
>

/**
 * Creates a community post. Mirrors `createCommunityPost`
 * (mutations/community/create-community-post). Quota-checked server-side for
 * non-members.
 */
export const mutateCreateCommunityPost = async ({
    mutation = MutationCreateCommunityPost.Mutation1,
    request,
    debug,
    signal,
}: MutateCreateCommunityPostParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateCreateCommunityPostResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
