import type { GraphQLResponse } from "../../types"
import type { UserEntity } from "@/modules/types/entities/user"
import type { WorkMode } from "@/modules/types/enums/work-mode"

/** GraphQL `UpdateProfileRequest` body (partial update; null clears a field). */
export interface UpdateProfileRequest {
    /** New display name; null clears it (UI falls back to username). */
    displayName?: string | null
    /** New short bio / tagline; null clears it. */
    bio?: string | null
    /** New avatar public URL (from the avatar-upload endpoint); null clears it. */
    avatar?: string | null
    /** Lock the profile (true = only the owner sees full content); omit to leave unchanged. */
    profileLocked?: boolean
    /** Mark the user as open to work (shows a hiring badge); omit to leave unchanged. */
    openToWork?: boolean
    /** Slug of the achievement to pin as the profile mascot; null clears it. */
    featuredAchievementSlug?: string | null
    /** Professional headline / role title; null clears it. */
    roleTitle?: string | null
    /** Free-text location; null clears it. */
    location?: string | null
    /** Preferred work arrangement (remote / hybrid / onsite); null clears it. */
    workMode?: WorkMode | null
    /** Public LinkedIn profile URL; null clears it. */
    linkedinUrl?: string | null
    /** Personal website / portfolio URL; null clears it. */
    websiteUrl?: string | null
}

/** Apollo response shape for `updateProfile` (returns the fresh user). */
export interface MutateUpdateProfileResponse {
    /** Top-level `updateProfile` field wrapping the standard API response. */
    updateProfile: GraphQLResponse<UserEntity>
}
