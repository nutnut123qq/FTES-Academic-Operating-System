"use client"

import useSWR from "swr"
import { getPublicProfile } from "@/modules/api/rest/profile"
import type { PublicProfile as PublicProfileDto } from "@/modules/api/rest/profile"

/** A public (read-only) profile view for the `/u/[username]` page. */
export interface PublicProfile {
    username: string
    name: string
    headline: string
    about: string
    campus: string
    skills: Array<string>
    followers: number
    /** Users this profile follows (from `counters.following`). */
    following: number
}

/**
 * Adapts the BE public-profile DTO (`GET /api/v1/profiles/{username}`) into the
 * `/u/[username]` view model. The BE exposes no free-form "skills" list, so it
 * degrades to an empty array (the skills card renders its empty state rather
 * than fabricating tags). Missing headline/campus/about degrade to empty.
 */
export const toPublicProfile = (dto: PublicProfileDto): PublicProfile => ({
    username: dto.username,
    name: dto.displayName ?? dto.username,
    headline: dto.jobTitle ?? "",
    about: dto.bio ?? "",
    campus: [dto.academic?.campus, dto.academic?.university].filter(Boolean).join(" · "),
    skills: [],
    followers: dto.counters?.followers ?? 0,
    following: dto.counters?.following ?? 0,
})

/** Loads a public profile by username from the real BE (`GET /profiles/{username}`). */
export const useQueryPublicProfileSwr = (username: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        username ? ["public-profile", username] : null,
        () => getPublicProfile(username).then(toPublicProfile),
    )
    return { profile: data, isLoading, error, mutate }
}
