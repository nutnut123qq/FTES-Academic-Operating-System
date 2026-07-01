"use client"

import React, { useCallback, useState } from "react"
import {
    Button,
    Link,
    TextArea,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { CommunityCommentRow } from "@/components/blocks/feed/CommunityCommentRow"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import type { QueryCommunityCommentNode } from "@/modules/api/graphql/queries/types/community-comments"
import { useMutateCreateCommunityPostCommentSwr } from "@/hooks/swr/api/graphql/mutations/useMutateCreateCommunityPostCommentSwr"
import { useMutateReactCommunityPostCommentSwr } from "@/hooks/swr/api/graphql/mutations/useMutateReactCommunityPostCommentSwr"
import { useQueryCommunityPostCommentsSwr } from "@/hooks/swr/api/graphql/queries/useQueryCommunityPostCommentsSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Props for the {@link CommunityCommentItem} feature. */
export interface CommunityCommentItemProps {
    /** Post the comment belongs to. */
    postId: string
    /** The top-level comment to render (with its reply controls). */
    comment: QueryCommunityCommentNode
    /** Whether the viewer is signed in (gates reply + reactions). */
    authenticated: boolean
    /** Refresh the parent list (updates this comment's reaction + reply counts). */
    onChanged?: () => void
}

/**
 * A top-level community comment with its reply affordances: react, reply (one
 * level deep), and an expandable list of its replies. Replies load lazily (their
 * own SWR) only when the viewer opens them.
 *
 * @param props - {@link CommunityCommentItemProps}
 */
export const CommunityCommentItem = ({
    postId,
    comment,
    authenticated,
    onChanged,
}: CommunityCommentItemProps) => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const [repliesOpen, setRepliesOpen] = useState(false)
    const [replyOpen, setReplyOpen] = useState(false)
    const [replyBody, setReplyBody] = useState("")

    const { trigger: reactComment } = useMutateReactCommunityPostCommentSwr()
    const { trigger: createComment, isMutating } = useMutateCreateCommunityPostCommentSwr()
    // replies load only once the list is opened
    const repliesSwr = useQueryCommunityPostCommentsSwr(postId, comment.id, repliesOpen)
    const replies = repliesSwr.data?.comments ?? []

    /** React to this top-level comment, then refresh the parent list. */
    const onReact = useCallback(
        async (type: ReactionType | null) => {
            await reactComment({ commentId: comment.id, type })
            onChanged?.()
        },
        [reactComment, comment.id, onChanged],
    )

    /** React to one of the replies, then refresh the reply list. */
    const onReactReply = useCallback(
        async (replyId: string, type: ReactionType | null) => {
            await reactComment({ commentId: replyId, type })
            await repliesSwr.mutate()
        },
        [reactComment, repliesSwr],
    )

    /** Post a reply to this comment, then open + refresh the reply list. */
    const onSubmitReply = useCallback(async () => {
        const trimmed = replyBody.trim()
        if (!trimmed) {
            return
        }
        const ok = await runGraphQL(
            async () => {
                const result = await createComment({
                    postId,
                    parentCommentId: comment.id,
                    body: trimmed,
                })
                return result.data!.createCommunityPostComment
            },
            { showSuccessToast: true },
        )
        if (ok) {
            setReplyBody("")
            setReplyOpen(false)
            setRepliesOpen(true)
            await repliesSwr.mutate()
            // bump this comment's replyCount in the parent list
            onChanged?.()
        }
    }, [replyBody, postId, comment.id, createComment, runGraphQL, repliesSwr, onChanged])

    return (
        <div className="flex flex-col gap-2">
            <CommunityCommentRow
                comment={comment}
                onReact={authenticated ? onReact : undefined}
                actions={(
                    <div className="flex items-center gap-3">
                        {authenticated ? (
                            <Link onPress={() => setReplyOpen((previous) => !previous)}>
                                <Typography type="body-xs" color="muted">
                                    {t("community.comments.reply")}
                                </Typography>
                            </Link>
                        ) : null}
                        {comment.replyCount > 0 ? (
                            <Link onPress={() => setRepliesOpen((previous) => !previous)}>
                                <Typography type="body-xs" className="text-accent">
                                    {repliesOpen
                                        ? t("community.comments.hideReplies")
                                        : t("community.comments.viewReplies", { count: comment.replyCount })}
                                </Typography>
                            </Link>
                        ) : null}
                    </div>
                )}
            />

            {replyOpen && authenticated ? (
                <div className="flex flex-col gap-2 pl-10">
                    <TextField variant="secondary">
                        <TextArea
                            rows={2}
                            value={replyBody}
                            onChange={(event) => setReplyBody(event.target.value)}
                            placeholder={t("community.comments.replyPlaceholder")}
                            aria-label={t("community.comments.replyPlaceholder")}
                            className="resize-none"
                        />
                    </TextField>
                    <div className="flex justify-end">
                        <Button
                            variant="primary"
                            size="sm"
                            isPending={isMutating}
                            isDisabled={!replyBody.trim()}
                            onPress={() => void onSubmitReply()}
                        >
                            {t("community.comments.send")}
                        </Button>
                    </div>
                </div>
            ) : null}

            {repliesOpen ? (
                <div className="flex flex-col gap-3 pl-10">
                    <AsyncContent
                        isLoading={repliesSwr.isLoading && replies.length === 0}
                        skeleton={(
                            <Typography type="body-xs" color="muted">
                                {t("community.comments.loading")}
                            </Typography>
                        )}
                        isEmpty={replies.length === 0}
                        emptyContent={{ title: t("community.comments.empty") }}
                        error={replies.length === 0 ? repliesSwr.error : undefined}
                        errorContent={{
                            title: t("community.comments.error"),
                            onRetry: () => void repliesSwr.mutate(),
                            retryLabel: t("community.retry"),
                        }}
                    >
                        <div className="flex flex-col gap-3">
                            {replies.map((reply) => (
                                <CommunityCommentRow
                                    key={reply.id}
                                    comment={reply}
                                    onReact={authenticated
                                        ? (type) => onReactReply(reply.id, type)
                                        : undefined}
                                />
                            ))}
                        </div>
                    </AsyncContent>
                </div>
            ) : null}
        </div>
    )
}
