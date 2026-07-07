"use client"

import useSWR from "swr"
import { getSelfProfile } from "@/modules/api/rest/profile"
import type { SelfProfile } from "@/modules/api/rest/profile"

/** SWR key shared by every self-profile reader so `GET /profiles/me` is fetched once. */
export const SELF_PROFILE_KEY = ["profiles", "me"] as const

/** A user's profile identity (consumed by the profile shell sidebar). */
export interface Profile {
    name: string
    /** Short headline / role line. */
    headline: string
    bio: string
    /** Campus / school line. */
    campus: string
    /** Uploaded avatar image URL (empty when unset). */
    avatarUrl: string
    /** Uploaded cover/banner image URL (empty when unset). */
    coverUrl: string
}

/**
 * Adapts the BE `SelfProfile` DTO (`GET /api/v1/profiles/me`) into the shell's
 * identity model. Missing fields degrade to empty strings — the sidebar guards
 * each with a truthiness check, so an empty value simply hides its row.
 */
export const toShellProfile = (profile: SelfProfile): Profile => ({
    name: profile.displayName ?? profile.username,
    headline: profile.jobTitle ?? "",
    bio: profile.bio ?? "",
    campus: [profile.academic?.campus, profile.academic?.university]
        .filter(Boolean)
        .join(" · "),
    avatarUrl: profile.avatarUrl ?? "",
    coverUrl: profile.coverUrl ?? "",
})

/** Loads the viewer's profile identity from the real BE (`GET /profiles/me`). */
export const useQueryProfileSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(SELF_PROFILE_KEY, getSelfProfile)
    return { profile: data ? toShellProfile(data) : undefined, isLoading, error, mutate }
}
