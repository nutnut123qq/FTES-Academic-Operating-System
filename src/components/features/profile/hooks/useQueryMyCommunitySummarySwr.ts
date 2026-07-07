"use client"

import useSWR from "swr"
import {
    getProfileFollowers,
    getProfileFollowing,
    getPublicProfile,
    getSelfProfile,
} from "@/modules/api/rest/profile"
import type { FollowEntry } from "@/modules/api/rest/profile"

/** One of the viewer's recent community posts. */
export interface MyCommunityPost {
    /** Community post id — row links to `/community/<id>`. */
    id: string
    title: string
    /** Human date line. */
    dateLabel: string
    likeCount: number
    commentCount: number
}

/** A follower / following user stub. */
export interface CommunityUser {
    id: string
    name: string
    /** Optional avatar URL; initials fallback when missing. */
    avatarUrl: string
    /** Short headline or username line. */
    headline: string
}

/** Community summary payload for the profile Community tab. */
export interface MyCommunitySummary {
    reputation: {
        score: number
        posts: number
        comments: number
        /** Reactions received on the viewer's content. */
        reactions: number
    }
    recentPosts: Array<MyCommunityPost>
    /** Users following the viewer. */
    followers: Array<CommunityUser>
    /** Users the viewer is following. */
    following: Array<CommunityUser>
}

/** Adapts a BE follow entry into the community user-row stub. */
const toCommunityUser = (entry: FollowEntry): CommunityUser => ({
    id: entry.userId,
    name: entry.displayName ?? entry.username,
    avatarUrl: entry.avatarUrl ?? "",
    headline: `@${entry.username}`,
})

/**
 * Loads the viewer's community summary from the real BE. Reputation comes from
 * the public-profile progress block; the follower/following lists come from the
 * follow list endpoints (best-effort — a private list degrades to empty). The BE
 * exposes no self "recent posts" or post/comment/reaction counters, so those
 * degrade to empty/zero (the tab renders empty states rather than fabricating).
 */
const fetchMyCommunitySummary = async (): Promise<MyCommunitySummary> => {
    const me = await getSelfProfile()
    const [publicProfile, followers, following] = await Promise.all([
        getPublicProfile(me.username).catch(() => null),
        getProfileFollowers(me.username)
            .then((page) => page.items)
            .catch(() => [] as Array<FollowEntry>),
        getProfileFollowing(me.username)
            .then((page) => page.items)
            .catch(() => [] as Array<FollowEntry>),
    ])
    return {
        reputation: {
            score: publicProfile?.progress?.reputation ?? 0,
            // BE exposes no post/comment/reaction counters for the self profile.
            posts: 0,
            comments: 0,
            reactions: 0,
        },
        // BE exposes no self "recent posts" feed on the profile module.
        recentPosts: [],
        followers: followers.map(toCommunityUser),
        following: following.map(toCommunityUser),
    }
}

/** Loads the viewer's community summary from the real BE. */
export const useQueryMyCommunitySummarySwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["my-community-summary"],
        fetchMyCommunitySummary,
    )
    return { data, isLoading, error, mutate }
}
