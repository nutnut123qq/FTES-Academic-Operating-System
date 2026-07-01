import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    SubmitContactRequest,
    MutateSubmitContactResponse,
} from "./types/contact"

const mutation1 = gql`
  mutation SubmitContact($request: SubmitContactRequest!) {
    submitContact(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationSubmitContact {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSubmitContact, DocumentNode> = {
    [MutationSubmitContact.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSubmitContact}. */
export type MutateSubmitContactParams = MutateParams<
    MutationSubmitContact,
    SubmitContactRequest
>

/**
 * Submits the public contact form (emailed to the team).
 *
 * Mirrors `submitContact` (mutations/contact/submit-contact/submit-contact.resolver.ts).
 * Public endpoint — works for anonymous visitors (the auth client sends no token
 * when none is present).
 */
export const mutateSubmitContact = async ({
    mutation = MutationSubmitContact.Mutation1,
    request,
    debug,
    signal,
}: MutateSubmitContactParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateSubmitContactResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
