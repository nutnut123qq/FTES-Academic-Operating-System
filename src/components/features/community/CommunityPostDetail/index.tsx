"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { PostEngagementBar } from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useQueryPostDetailSwr } from "../hooks/useQueryPostDetailSwr"
import { useMutateReactPostSwr } from "../hooks/useMutateReactPostSwr"
import { useMutateCreatePostCommentSwr, type SubmitCommentInput } from "../hooks/useMutateCreatePostCommentSwr"

/**
 * Community post detail (§6). The post (author + title + body) over the shared
 * engagement bar (like · comment · share · save) and a permanently-expanded
 * comment thread (list + composer, flat one-level replies). Keeps `id="comments"`
 * for deep links (`#comments` autofocuses the composer). ponytail: mock data.
 */
export const CommunityPostDetail = () => {
    const t = useTranslations("communityHub")
    const locale = useLocale()
    const { postId } = useParams<{ postId: string }>()
    const { post } = useQueryPostDetailSwr(postId)
    const reactPost = useMutateReactPostSwr()
    const submitComment = useMutateCreatePostCommentSwr()
    const [deepLinked, setDeepLinked] = useState(false)

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
        <div className="flex flex-col gap-6">
            {/* post */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                        {post.author.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <Typography type="body-sm" weight="medium">
                            {post.author}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {post.timeLabel}
                        </Typography>
                    </div>
                </div>
                <Typography type="h5" weight="bold">
                    {post.title}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {post.body}
                </Typography>
                <PostEngagementBar
                    likes={post.likes}
                    liked={post.liked}
                    commentsCount={commentsCount}
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
            </div>

            {/* comments */}
            <div id="comments" className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
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
