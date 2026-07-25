"use client"

import useSWR from "swr"
import { getPublicProfile } from "@/modules/api/rest/profile"
import type { PublicProfile } from "@/modules/api/rest/profile"
import type { UserHovercardData } from "@/modules/types/user-hovercard"

/**
 * SWR cache key of one user's hovercard, keyed by USERNAME (not id) so every
 * `<UserLink username="…">` on the page — feed rows, comments, member lists —
 * subscribes to the same entry and re-renders together after an optimistic
 * follow toggle.
 *
 * @param username - the target user's handle.
 */
export const userHovercardKey = (username: string) =>
    ["QUERY_USER_HOVERCARD_SWR", username] as const

/**
 * Adapts the real public-profile DTO (`GET /api/v1/profiles/{username}`) into the
 * lightweight hovercard payload.
 *
 * `isFollowedByMe` stays UNDEFINED on purpose: the backend exposes no
 * viewer-scoped follow flag (neither `PublicProfile` nor any community read
 * returns one — see the report's deferred note), so the card must not claim
 * "Following" it cannot prove. It becomes `true`/`false` only after the viewer
 * toggles follow in this session (optimistic write into this same cache entry).
 *
 * @param dto - the backend public profile.
 */
export const toUserHovercardData = (dto: PublicProfile): UserHovercardData => ({
    id: dto.userId,
    username: dto.username,
    displayName: dto.displayName ?? null,
    bio: dto.bio ?? null,
    avatar: dto.avatarUrl ?? null,
    followerCount: dto.counters?.followers ?? 0,
    followingCount: dto.counters?.following ?? 0,
    isFollowedByMe: undefined,
})

/**
 * Loads the hovercard profile from the REAL backend (`GET /api/v1/profiles/{username}`,
 * guest-readable — privacy-masked server-side). Runs for anonymous viewers too;
 * a PRIVATE/MEMBERS-only profile rejects with a `RestError` and the card renders
 * its error state.
 *
 * Fetching is lazy (the caller passes `null` until the card actually opens) and
 * the result is deduped for a minute, so hovering the same author repeatedly in a
 * feed costs one request.
 *
 * @param username - handle of the user whose hovercard to fetch; `null` disables the fetch.
 */
export const useQueryUserHovercardSwr = (username: string | null | undefined) => {
    const swr = useSWR(
        username ? userHovercardKey(username) : null,
        async () => toUserHovercardData(await getPublicProfile(username as string)),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        },
    )

    return swr
}
