import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { UpdateMyAiSettingsRequest, MutateUpdateMyAiSettingsResponse } from "./types/update-my-ai-settings"

const mutation1 = gql`
  mutation UpdateMyAiSettings($request: UpdateMyAiSettingsRequest!) {
    updateMyAiSettings(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationUpdateMyAiSettings {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationUpdateMyAiSettings, DocumentNode> = {
    [MutationUpdateMyAiSettings.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateUpdateMyAiSettings}. */
export type MutateUpdateMyAiSettingsParams = MutateParams<
    MutationUpdateMyAiSettings,
    UpdateMyAiSettingsRequest
>

/**
 * Updates the current user's AI lane settings (lane preference + BYOK key).
 *
 * Mirrors `updateMyAiSettings` (mutations/ai/update-my-ai-settings.resolver.ts).
 */
export const mutateUpdateMyAiSettings = async ({
    mutation = MutationUpdateMyAiSettings.Mutation1,
    request,
    debug,
    signal,
}: MutateUpdateMyAiSettingsParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateUpdateMyAiSettingsResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
