"use client"

import React, { useCallback } from "react"
import { Button, Skeleton, Typography, toast } from "@heroui/react"
import { BookmarkSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { UserLink } from "@/components/features/identity"
import { ThreadsPostRow } from "@/components/blocks/feed/ThreadsPostRow"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"
import {
    useQueryBookmarkedPostsSwr,
    type SavedPost,
} from "../hooks/useQueryBookmarkedPostsSwr"

/** Loading skeleton — mirrors the saved-row anatomy so the list never jumps. */
const SavedSkeleton = () => (
    <div className="flex flex-col divide-y divide-separator">
        {[0, 1, 2].map((index) => (
            <div key={index} className="px-4 py-3">
                <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-2">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex min-w-0 flex-col gap-2">
                        <Skeleton className="h-3 w-32 rounded-full" />
                        <Skeleton className="h-3 w-full rounded-full" />
                        <Skeleton className="h-3 w-3/4 rounded-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
)

/** One saved post row: author header + title/snippet link + un-bookmark button. */
const SavedRow = ({
    post,
    onUnsave,
}: {
    post: SavedPost
    onUnsave: (postId: string) => Promise<void>
}) => {
    const t = useTranslations("communityHub")
    const [pending, setPending] = React.useState(false)

    const handleUnsave = useCallback(async () => {
        setPending(true)
        try {
            await onUnsave(post.id)
        } catch {
            toast.danger(t("saved.unsaveFailed"))
        } finally {
            setPending(false)
        }
    }, [onUnsave, post.id, t])

    return (
        <div className="px-4 py-3 transition-colors hover:bg-default/40">
            <ThreadsPostRow
                avatar={
                    <UserLink
                        username={post.authorUsername}
                        displayName={post.authorName}
                        avatar={post.authorAvatarUrl}
                        seed={post.seed}
                        hideName
                        size="sm"
                        className="size-9"
                        classNames={{ avatar: "size-9" }}
                    />
                }
                author={
                    post.authorName ? (
                        <UserLink
                            username={post.authorUsername}
                            displayName={post.authorName}
                            avatar={post.authorAvatarUrl}
                            seed={post.seed}
                            showAvatar={false}
                        />
                    ) : (
                        <Typography type="body-sm" color="muted">
                            {t("saved.member")}
                        </Typography>
                    )
                }
                timeLabel={post.timeLabel}
            >
                <div className="flex items-start gap-2">
                    {/* only the title + snippet navigate; the un-bookmark button keeps its own press */}
                    <Link
                        href={`/community/${post.id}`}
                        className="flex min-w-0 flex-1 flex-col gap-0 no-underline"
                    >
                        <Typography type="body-sm" weight="medium">
                            {post.title}
                        </Typography>
                        <Typography type="body-sm" className="line-clamp-3">
                            {post.snippet}
                        </Typography>
                    </Link>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-accent"
                        aria-label={t("saved.unsave")}
                        isDisabled={pending}
                        onPress={handleUnsave}
                    >
                        <BookmarkSimpleIcon
                            aria-hidden
                            focusable="false"
                            weight="fill"
                            className="size-5"
                        />
                    </Button>
                </div>
                <div className="flex items-center gap-4 text-muted">
                    <Typography type="body-xs" color="muted">
                        {t("feed.likes", { count: post.likes })}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("feed.comments", { count: post.comments })}
                    </Typography>
                </div>
            </ThreadsPostRow>
        </div>
    )
}

/**
 * Saved page (`/community/saved`) — the caller's bookmarked posts hydrated as full,
 * author-enriched cards (newest-saved first) from the real BE REST
 * `GET /community/bookmarks/posts`, cursor-paginated with infinite scroll. Each row
 * has an un-bookmark button that optimistically removes the card (rolling back on
 * failure via `DELETE /community/bookmarks/{postId}`). Rows sit FLAT in a
 * `divide-separator` column, matching the community feed idiom.
 */
export const CommunitySaved = () => {
    const t = useTranslations("communityHub")
    const { posts, isLoading, isLoadingMore, error, hasMore, setSize, mutate, removePost } =
        useQueryBookmarkedPostsSwr()

    return (
        <div className="flex flex-col">
            <div className="px-4 py-3">
                <Typography type="h5" weight="semibold">
                    {t("saved.title")}
                </Typography>
            </div>
            <AsyncContent
                isLoading={isLoading && posts.length === 0}
                skeleton={<SavedSkeleton />}
                isEmpty={posts.length === 0}
                emptyContent={{
                    title: t("saved.empty"),
                    description: t("saved.emptyHint"),
                }}
                error={posts.length === 0 ? error : undefined}
                errorContent={{
                    title: t("saved.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col divide-y divide-separator">
                    {posts.map((post) => (
                        <SavedRow key={post.id} post={post} onUnsave={removePost} />
                    ))}
                </div>
                <InfiniteScrollSentinel
                    onReach={() => void setSize((current) => current + 1)}
                    disabled={!hasMore || isLoadingMore}
                />
            </AsyncContent>
        </div>
    )
}
