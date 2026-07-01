"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryPostDetailSwr } from "../hooks/useQueryPostDetailSwr"

/**
 * Community post detail (§6). DEFAULT on-canon layout: the post (author + title +
 * body + like count) over a comments thread. ponytail: hand-rolled; mock data.
 */
export const CommunityPostDetail = () => {
    const t = useTranslations("communityHub")
    const { postId } = useParams<{ postId: string }>()
    const { post } = useQueryPostDetailSwr(postId)

    if (!post) {
        return null
    }

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
                <Typography type="body-xs" color="muted">
                    {t("feed.likes", { count: post.likes })}
                </Typography>
            </div>

            {/* comments */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("detail.comments", { count: post.comments.length })}
                </Typography>
                {post.comments.map((comment) => (
                    <div
                        key={comment.id}
                        className="flex items-start gap-3 rounded-large border border-separator p-4"
                    >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                            {comment.author.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Typography type="body-sm" weight="medium">
                                    {comment.author}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {comment.timeLabel}
                                </Typography>
                            </div>
                            <Typography type="body-sm" color="muted">
                                {comment.text}
                            </Typography>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
