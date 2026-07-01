import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SendChatMessageRequest, MutateSendChatMessageResponse } from "./types/chat"

const mutation1 = gql`
  mutation SendChatMessage($request: SendChatMessageRequest!) {
    sendChatMessage(request: $request) {
      success
      message
      error
      data {
        id
        conversationId
        body
        createdAt
        author {
          id
          username
          displayName
          avatar
        }
        isMine
        isFounderAuthor
      }
    }
  }
`

export enum MutationSendChatMessage {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSendChatMessage, DocumentNode> = {
    [MutationSendChatMessage.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSendChatMessage}. */
export type MutateSendChatMessageParams = MutateParams<
    MutationSendChatMessage,
    SendChatMessageRequest
>

/**
 * Sends a chat message to a conversation. Mirrors `sendChatMessage`
 * (mutations/chat/send-chat-message). Member-only; founder DM restricted to its
 * member + the founder (enforced server-side).
 */
export const mutateSendChatMessage = async ({
    mutation = MutationSendChatMessage.Mutation1,
    request,
    debug,
    signal,
}: MutateSendChatMessageParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateSendChatMessageResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
