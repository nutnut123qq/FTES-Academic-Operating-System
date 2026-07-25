"use client"

import useSWR from "swr"
import { useLocale, useTranslations } from "next-intl"
import { restRequest } from "@/modules/api/rest/client"
import type { FeedPage, PostResponse } from "@/modules/api/rest/community"
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

/**
 * How many of the viewer's newest posts the Community tab lists. The same page also
 * feeds the post/comment/reaction counters (the BE exposes no aggregate counter), so
 * those are a LOWER BOUND over this window — see {@link toMyCommunitySummaryCounters}.
 */
const RECENT_POSTS_LIMIT = 5

/** Adapts a BE follow entry into the community user-row stub. */
const toCommunityUser = (entry: FollowEntry): CommunityUser => ({
    id: entry.userId,
    name: entry.displayName ?? entry.username,
    avatarUrl: entry.avatarUrl ?? "",
    headline: `@${entry.username}`,
})

/** Locale date line for a post row; "" when the BE sent no / an unparseable timestamp. */
const toDateLabel = (iso: string | undefined, locale: string): string => {
    if (!iso) {
        return ""
    }
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
        return ""
    }
    return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
}

/**
 * Maps a BE `PostResponse` (REST `GET /community/search`) onto the profile row contract.
 * Community posts may legitimately have NO title (Threads-style body-only posts), so the
 * row falls back to a short body excerpt and finally to a translated "untitled" label —
 * never to an empty, unclickable-looking row.
 */
export const toMyCommunityPost = (
    post: PostResponse,
    locale: string,
    untitledLabel: string,
): MyCommunityPost => ({
    id: post.id,
    title: post.title?.trim() || post.content?.trim().slice(0, 80) || untitledLabel,
    dateLabel: toDateLabel(post.createdAt, locale),
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
})

/**
 * Derives the reputation counters from the viewer's most recent posts.
 *
 * The community module exposes no aggregate "my posts / my comments / my reactions"
 * endpoint, so these are counted over the {@link RECENT_POSTS_LIMIT} window returned by
 * `GET /community/search?author=<me>`: `posts` = rows in the window, `comments` /
 * `reactions` = comments and likes RECEIVED on them. When the window is full the numbers
 * are a lower bound, not a lifetime total — do not present them as exact totals.
 */
export const toMyCommunitySummaryCounters = (
    posts: Array<PostResponse>,
): { posts: number; comments: number; reactions: number } => ({
    posts: posts.length,
    comments: posts.reduce((total, post) => total + (post.commentCount ?? 0), 0),
    reactions: posts.reduce((total, post) => total + (post.likeCount ?? 0), 0),
})

/**
 * The viewer's newest community posts, from the REST parity of `communitySearch`
 * (`GET /api/v1/community/search?author=<userId>&limit=`, `PostController#search`).
 * Best-effort: any failure (403/404/429/offline) degrades to an empty page so the whole
 * Community tab still renders its other blocks instead of erroring out.
 */
const fetchMyRecentPosts = async (userId: string): Promise<Array<PostResponse>> => {
    try {
        const page = await restRequest<FeedPage<PostResponse>>({
            method: "GET",
            url: "/community/search",
            params: { author: userId, limit: RECENT_POSTS_LIMIT },
            authenticated: true,
        })
        return page?.items ?? []
    } catch {
        return []
    }
}

/**
 * Loads the viewer's community summary from the real BE. Reputation score comes from the
 * public-profile progress block; the follower/following lists come from the follow list
 * endpoints; the recent posts + post/comment/reaction counters come from the community
 * search endpoint filtered to the viewer (`author=<userId>`). Every secondary call is
 * best-effort — a private list or a community outage degrades that block to empty rather
 * than failing the tab.
 */
const fetchMyCommunitySummary = async (
    locale: string,
    untitledLabel: string,
): Promise<MyCommunitySummary> => {
    const me = await getSelfProfile()
    const [publicProfile, followers, following, myPosts] = await Promise.all([
        getPublicProfile(me.username).catch(() => null),
        getProfileFollowers(me.username)
            .then((page) => page.items)
            .catch(() => [] as Array<FollowEntry>),
        getProfileFollowing(me.username)
            .then((page) => page.items)
            .catch(() => [] as Array<FollowEntry>),
        fetchMyRecentPosts(me.userId),
    ])
    const counters = toMyCommunitySummaryCounters(myPosts)
    return {
        reputation: {
            score: publicProfile?.progress?.reputation ?? 0,
            ...counters,
        },
        recentPosts: myPosts.map((post) => toMyCommunityPost(post, locale, untitledLabel)),
        followers: followers.map(toCommunityUser),
        following: following.map(toCommunityUser),
    }
}

/**
 * Loads the viewer's community summary from the real BE. The locale is part of the SWR key
 * because the post rows carry a locale-formatted date line.
 */
export const useQueryMyCommunitySummarySwr = () => {
    const locale = useLocale()
    const t = useTranslations("profile.community.recentPosts")
    const untitledLabel = t("untitled")

    const { data, isLoading, error, mutate } = useSWR(
        ["my-community-summary", locale],
        () => fetchMyCommunitySummary(locale, untitledLabel),
    )
    return { data, isLoading, error, mutate }
}
