"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useCommunityComposerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { CommunityFeedRow } from "@/components/features/community/CommunityFeed"
import {
    CommunitySearchSort,
    useQueryCommunitySearchSwr,
} from "@/components/features/community/hooks/useQueryCommunitySearchSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link MyPosts}. */
export type MyPostsProps = WithClassNames<undefined>

/**
 * How many rows the section shows before the viewer asks for more — and how many each
 * "xem thêm" press adds. Deliberately small: this is a dashboard SUMMARY of your posts,
 * not the archive (the header see-more link owns that, at `/u/{username}`), so it stays a
 * fixed-height glance instead of an endless wall of one's own posts.
 */
export const MY_POSTS_STEP = 3

/** Loading skeleton — mirrors the `ThreadsPostRow` anatomy the real rows render. */
const MyPostsSkeleton = () => (
    <div className="flex flex-col divide-y divide-separator">
        {[0, 1, 2].map((row) => (
            <div key={row} className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-2 px-4 py-3">
                {/* 36px avatar, matching the row's `size-9` UserLink (not a Skeleton.Avatar
                    size token, which caps at size-8) */}
                <Skeleton className="size-9 rounded-full" />
                <div className="flex min-w-0 flex-col gap-1">
                    <Skeleton.Typography type="body-xs" width="1/3" />
                    <Skeleton.Typography type="body-sm" width="full" />
                    <Skeleton.Typography type="body-sm" width="3/4" />
                    <Skeleton className="h-4 w-24 rounded-full" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * "Bài viết của tôi" — every community post the VIEWER published, newest first.
 *
 * No new read was written for this: it borrows the shared community SEARCH hook with
 * only the `authorId` criterion set (`q: ""`), which is exactly what the BE
 * `communitySearch(authorId)` filter is for. That buys cursor pagination, the shared
 * {@link CommunityFeedRow} (engagement bar, owner ⋯ menu, inline comments) and — because
 * `COMMUNITY_SEARCH_TAG` starts with `COMMUNITY_FEED_TAG` — the optimistic like/comment
 * mutations patch these rows just like a feed row. A hand-rolled SWR key would have
 * silently dropped that patching, so the hook is used verbatim.
 *
 * RENDER CAP: only {@link MY_POSTS_STEP} rows are rendered up front, with a "xem thêm"
 * button below the list adding another step per press. This replaces an
 * `InfiniteScrollSentinel` that auto-paged as the viewer scrolled — an author with a few
 * hundred posts turned the whole MY RESOURCE panel into their own feed. The button reveals
 * out of what SWR ALREADY holds first and only calls `setSize` once a press runs past the
 * loaded posts while `hasMore` is still true, so surfacing post #4 out of a 20-post page
 * costs no request. It hides only when the loaded list is exhausted AND `hasMore` is false.
 *
 * The cap is a RENDER concern, not a query one: the criteria and page limit are untouched,
 * so the like/comment cache patching and the header see-more link behave exactly as before.
 *
 * Guests never fetch: with no signed-in user `authorId` is `""` → `isSearchActive()` is
 * false → the infinite key is `null`, and the empty branch invites sign-in instead.
 *
 * Follow state is deliberately NOT batch-read here (unlike the community feed): every row
 * on this list has the SAME author — the viewer — so there is nothing to resolve.
 *
 * SCOPE CAVEAT: `communitySearch` is the PUBLIC read path. Whether it also returns the
 * viewer's unpublished drafts or their posts inside private groups is unverified — check
 * on a deploy before promising "tất cả bài của tôi".
 *
 * @param props - optional root class name (placement only)
 */
export const MyPosts = ({ className }: MyPostsProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { authenticated, requireAuth } = useRequireAuth()
    const { open: openComposer } = useCommunityComposerOverlayState()
    const me = useAppSelector((state) => state.user.user)

    const criteria = useMemo(
        () => ({ q: "", sort: CommunitySearchSort.Newest, authorId: me?.id ?? "" }),
        [me?.id],
    )
    const {
        posts,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        setSize,
        mutate,
    } = useQueryCommunitySearchSwr(criteria)

    // How many of the fetched posts are actually rendered. Only an explicit press grows it.
    const [visibleCount, setVisibleCount] = useState(MY_POSTS_STEP)

    // A different viewer is a different list: collapse back to the first step so a newly
    // signed-in account does not inherit however far the previous one had expanded.
    useEffect(() => { setVisibleCount(MY_POSTS_STEP) }, [me?.id])

    const visiblePosts = posts.slice(0, visibleCount)

    /** Something is still hidden, or the BE has another page — either way, offer the button. */
    const canRevealMore = visibleCount < posts.length || hasMore

    /**
     * Reveal the next step. Posts already in the SWR cache appear without a round-trip; a
     * page is fetched only when the new count runs PAST what is loaded and `hasMore` says
     * the BE has it.
     */
    const revealMore = () => {
        const next = visibleCount + MY_POSTS_STEP
        setVisibleCount(next)
        if (next > posts.length && hasMore && !isLoadingMore) {
            void setSize((current) => current + 1)
        }
    }

    // The session flag lands BEFORE the profile does, and until `user.user` arrives the
    // criteria carry no `authorId` → the hook is idle with zero posts, which would flash
    // "bạn chưa đăng bài nào" at an author who has plenty. Count that window as loading.
    const isResolvingViewer = authenticated && !me?.id

    /** Guests get a sign-in prompt; signed-in authors get the composer CTA. */
    const emptyContent = !authenticated
        ? {
            icon: <FtesMascot pose="greeting" size="lg" />,
            title: t("dashboard.myResource.myPosts.guestTitle"),
            description: t("dashboard.myResource.myPosts.guestDescription"),
            action: (
                <Button
                    size="sm"
                    variant="primary"
                    onPress={() => requireAuth("auth.context.generic")}
                >
                    {t("communityHub.feed.guestCta")}
                </Button>
            ),
        }
        : {
            icon: <FtesMascot pose="explain" size="lg" />,
            title: t("dashboard.myResource.myPosts.emptyTitle"),
            description: t("dashboard.myResource.myPosts.emptyDescription"),
            action: (
                <Button size="sm" variant="primary" onPress={openComposer}>
                    {t("communityHub.feed.emptyCompose")}
                </Button>
            ),
        }

    return (
        <LabeledCard
            className={className}
            label={t("dashboard.myResource.myPosts.title")}
            // the rows are flat (hairline dividers, no card fill) → framing them would
            // wrap a card around an edge-to-edge list, same call as ExploreFeed
            frameless
            // only a signed-in viewer HAS a profile page to send them to
            onSeeMore={me?.username ? () => router.push(`/u/${me.username}`) : undefined}
            seeMoreLabel={t("dashboard.myResource.myPosts.seeMore")}
        >
            <AsyncContent
                isLoading={(isLoading || isResolvingViewer) && posts.length === 0}
                skeleton={<MyPostsSkeleton />}
                isEmpty={posts.length === 0}
                emptyContent={emptyContent}
                error={posts.length === 0 ? error : undefined}
                errorContent={{
                    title: t("dashboard.myResource.myPosts.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("dashboard.retry"),
                }}
            >
                <div className="flex flex-col divide-y divide-separator">
                    {visiblePosts.map((post) => (
                        <CommunityFeedRow key={post.id} post={post} />
                    ))}
                </div>
                {canRevealMore ? (
                    <>
                        {isLoadingMore ? (
                            <div className="px-4 py-3" aria-hidden>
                                <Skeleton className="h-3 w-40 rounded-full" />
                            </div>
                        ) : null}
                        <div className="flex justify-center pt-3">
                            <Button
                                size="sm"
                                variant="tertiary"
                                className="text-accent"
                                isDisabled={isLoadingMore}
                                onPress={revealMore}
                            >
                                {t("dashboard.loadMore")}
                            </Button>
                        </div>
                    </>
                ) : null}
            </AsyncContent>
        </LabeledCard>
    )
}
