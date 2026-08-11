"use client"

import useSWR from "swr"
import { useLocale, useTranslations } from "next-intl"
import { restRequest } from "@/modules/api/rest/client"
import type { FeedPage, PostResponse } from "@/modules/api/rest/community"
import { getProfileFollowers, getProfileFollowing } from "@/modules/api/rest/profile"
import type { FollowEntry } from "@/modules/api/rest/profile"
import {
    toMyCommunityPost,
    type CommunityUser,
    type MyCommunityPost,
} from "./useQueryMyCommunitySummarySwr"

/**
 * A follower / following row. Extends the shared {@link CommunityUser} stub with the raw
 * `username`, because on a PUBLIC profile each row links onward to that user's own
 * `/u/[username]` page — deriving the handle back out of the display-only `headline`
 * string would break the moment that line stops being exactly `@username`.
 */
export interface PublicCommunityUser extends CommunityUser {
    /** Login handle, without the leading `@` — the `/u/[username]` route segment. */
    username: string
}

/** Community payload behind a public profile's Community tab. */
export interface PublicCommunity {
    /** First page of this profile's followers. */
    followers: Array<PublicCommunityUser>
    /** First page of the users this profile follows. */
    following: Array<PublicCommunityUser>
    /** This profile's newest community posts. */
    recentPosts: Array<MyCommunityPost>
}

/** How many follower/following rows the tab lists (the authoritative TOTAL comes from `counters`). */
const RELATION_PAGE = 20
/** How many of the profile's newest community posts the tab lists. */
const RECENT_POSTS_LIMIT = 5

/** Adapts a BE follow entry into the linkable community user-row stub. */
const toCommunityUser = (entry: FollowEntry): PublicCommunityUser => ({
    id: entry.userId,
    name: entry.displayName ?? entry.username,
    avatarUrl: entry.avatarUrl ?? "",
    headline: `@${entry.username}`,
    username: entry.username,
})

/**
 * Loads a public profile's community blocks. EVERY call is best-effort — the BE returns
 * `PROFILE_PRIVATE` when the owner hides their follow lists (`showFollowers=false`), and
 * `GET /community/search` needs a signed-in caller — so any one failure degrades that
 * block to empty instead of collapsing the whole tab.
 *
 * The follower/following COUNTS are NOT derived from these arrays (they are one capped
 * page); the tab reads the authoritative totals from the profile's `counters`.
 */
const fetchPublicCommunity = async (
    username: string,
    userId: string,
    locale: string,
    untitledLabel: string,
): Promise<PublicCommunity> => {
    const [followers, following, posts] = await Promise.all([
        getProfileFollowers(username, { limit: RELATION_PAGE })
            .then((page) => page.items ?? [])
            .catch(() => [] as Array<FollowEntry>),
        getProfileFollowing(username, { limit: RELATION_PAGE })
            .then((page) => page.items ?? [])
            .catch(() => [] as Array<FollowEntry>),
        restRequest<FeedPage<PostResponse>>({
            method: "GET",
            url: "/community/search",
            params: { author: userId, limit: RECENT_POSTS_LIMIT },
            authenticated: true,
        })
            .then((page) => page?.items ?? [])
            .catch(() => [] as Array<PostResponse>),
    ])

    return {
        followers: followers.map(toCommunityUser),
        following: following.map(toCommunityUser),
        recentPosts: posts.map((post) => toMyCommunityPost(post, locale, untitledLabel)),
    }
}

/**
 * Loads the community blocks for `/u/[username]`. The locale is part of the SWR key
 * because post rows carry a locale-formatted date line.
 *
 * @param username - Handle in the route (drives the follow-list endpoints).
 * @param userId - BE user UUID (drives `GET /community/search?author=`).
 */
export const useQueryPublicCommunitySwr = (
    username: string,
    userId: string | undefined,
) => {
    const locale = useLocale()
    const t = useTranslations("profile.community.recentPosts")
    const untitledLabel = t("untitled")

    const { data, isLoading, error, mutate } = useSWR(
        username && userId ? ["public-profile-community", username, userId, locale] : null,
        () => fetchPublicCommunity(username, userId as string, locale, untitledLabel),
    )
    return { data, isLoading, error, mutate }
}
