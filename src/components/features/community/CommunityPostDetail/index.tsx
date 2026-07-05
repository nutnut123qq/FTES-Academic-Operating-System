"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { UserLink } from "@/components/features/identity"
import { ThreadsPostRow } from "@/components/blocks/feed/ThreadsPostRow"
import { PostEngagementBar } from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useQueryPostDetailSwr } from "../hooks/useQueryPostDetailSwr"
import { useMutateReactPostSwr } from "../hooks/useMutateReactPostSwr"
import { useMutateCreatePostCommentSwr, type SubmitCommentInput } from "../hooks/useMutateCreatePostCommentSwr"

/**
 * Community post detail (§6), Threads-style. The post rendered with the same
 * `ThreadsPostRow` anatomy as the feed (48px avatar column, name + relative
 * time on one line, title + full body in the content column) over the shared
 * engagement bar (zero counts suppressed) and a permanently-expanded comment
 * thread; a threadline runs from the author avatar toward the comments when
 * the post has any. Keeps `id="comments"` for deep links (`#comments`
 * autofocuses the composer). ponytail: mock data.
 */
export const CommunityPostDetail = () => {
    const t = useTranslations("communityHub")
    const locale = useLocale()
    const { postId } = useParams<{ postId: string }>()
    const { post } = useQueryPostDetailSwr(postId)
    const reactPost = useMutateReactPostSwr()
    const submitComment = useMutateCreatePostCommentSwr()
    const [deepLinked, setDeepLinked] = useState(false)
    const currentUser = useAppSelector((state) => state.user.user)

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash === "#comments") {
            setDeepLinked(true)
        }
    }, [])

    const onSubmit = useCallback(
        async (body: string, parentCommentId?: string): Promise<boolean> => {
            const input: SubmitCommentInput = {
                postId,
                body,
                authorLabel: locale === "vi" ? "Bạn" : "You",
                authorUsername: currentUser?.username ?? "you",
                justNowLabel: locale === "vi" ? "vừa xong" : "just now",
                parentCommentId,
            }
            return submitComment(input)
        },
        [postId, locale, submitComment],
    )

    if (!post) {
        return null
    }

    const commentsCount = post.comments.reduce(
        (total, comment) => total + 1 + (comment.replies?.length ?? 0),
        0,
    )
    const postUrl =
        typeof window !== "undefined" ? `${window.location.origin}/${locale}/community/${postId}` : ""

    return (
        <div className="flex flex-col gap-3 py-3">
            <ThreadsPostRow
                avatar={
                    <UserLink
                        username={post.authorUsername}
                        displayName={post.author}
                        hideName
                        size="sm"
                        className="size-9"
                        classNames={{ avatar: "size-9" }}
                    />
                }
                author={<UserLink username={post.authorUsername} displayName={post.author} showAvatar={false} />}
                timeLabel={post.timeLabel}
                threadline={commentsCount > 0}
            >
                <Typography type="h5" weight="bold">
                    {post.title}
                </Typography>
                <Typography type="body-sm">{post.body}</Typography>
                <PostEngagementBar
                    likes={post.likes}
                    liked={post.liked}
                    commentsCount={commentsCount}
                    hideZeroCounts
                    onToggleLike={() => void reactPost(postId, !post.liked)}
                    onCommentClick={() => {
                        document.getElementById(`post-comments-${postId}`)?.focus()
                    }}
                    postUrl={postUrl}
                    shareTitle={post.title}
                    saveEntityType="post"
                    saveEntityId={postId}
                    saveSource={{ kind: "community", label: post.author }}
                />
            </ThreadsPostRow>

            {/* comments — hairline continues the column rhythm; threadline above points here */}
            <div id="comments" className="flex flex-col gap-3 border-t border-separator pt-3">
                <Typography type="body-sm" weight="semibold">
                    {t("detail.comments", { count: commentsCount })}
                </Typography>
                <PostCommentThread
                    regionId={`post-comments-${postId}`}
                    comments={post.comments}
                    isLoading={false}
                    onSubmit={onSubmit}
                    autoFocus={deepLinked}
                    stickyComposerOnMobile
                />
            </div>
        </div>
    )
}
