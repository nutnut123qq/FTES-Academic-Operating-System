import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { UpdateProfileRequest, MutateUpdateProfileResponse } from "./types/update-profile"

const mutation1 = gql`
  mutation UpdateProfile($request: UpdateProfileRequest!) {
    updateProfile(request: $request) {
      success
      message
      error
      data {
        id
        email
        avatar
        username
        displayName
        bio
        githubUsername
        followerCount
        followingCount
        profileLocked
        openToWork
        featuredAchievementSlug
        roleTitle
        location
        workMode
        linkedinUrl
        websiteUrl
      }
    }
  }
`

export enum MutationUpdateProfile {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationUpdateProfile, DocumentNode> = {
    [MutationUpdateProfile.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateUpdateProfile}. */
export type MutateUpdateProfileParams = MutateParams<
    MutationUpdateProfile,
    UpdateProfileRequest
>

/**
 * Updates the current user's editable profile fields (display name, bio, avatar URL).
 *
 * Mirrors `updateProfile` (mutations/profile/update-profile/update-profile.resolver.ts).
 */
export const mutateUpdateProfile = async ({
    mutation = MutationUpdateProfile.Mutation1,
    request,
    debug,
    signal,
}: MutateUpdateProfileParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateUpdateProfileResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
