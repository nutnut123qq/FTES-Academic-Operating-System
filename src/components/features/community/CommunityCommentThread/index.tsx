"use client"

import React, { useCallback, useState } from "react"
import {
    Button,
    TextArea,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { CommunityCommentItem } from "../CommunityCommentItem"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useMutateCreateCommunityPostCommentSwr } from "@/hooks/swr/api/graphql/mutations/useMutateCreateCommunityPostCommentSwr"
import { useQueryCommunityPostCommentsSwr } from "@/hooks/swr/api/graphql/queries/useQueryCommunityPostCommentsSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Props for the {@link CommunityCommentThread} feature. */
export interface CommunityCommentThreadProps {
    /** Post whose comments are shown. */
    postId: string
    /** Whether the viewer is signed in (gates the composer + reactions). */
    authenticated: boolean
    /** Called after a comment is created so the parent can refresh the post. */
    onChanged?: () => void
}

/**
 * Expandable comment thread under a community post: lists top-level comments (each
 * with its own reply + nested-replies controls via {@link CommunityCommentItem}),
 * plus a composer for signed-in users. Loads its own data (SWR) so the feed only
 * fetches it when a post is expanded.
 *
 * @param props - {@link CommunityCommentThreadProps}
 */
export const CommunityCommentThread = ({
    postId,
    authenticated,
    onChanged,
}: CommunityCommentThreadProps) => {
    const t = useTranslations()
    const [body, setBody] = useState("")
    const runGraphQL = useGraphQLWithToast()

    const { data, isLoading, error, mutate } = useQueryCommunityPostCommentsSwr(postId)
    const { trigger: createComment, isMutating } = useMutateCreateCommunityPostCommentSwr()

    const comments = data?.comments ?? []

    /** Submit a new top-level comment, then clear + refresh. */
    const onSubmit = useCallback(async () => {
        const trimmed = body.trim()
        if (!trimmed) {
            return
        }
        // toast-wrapped create; action returns the inner GraphQLResponse
        const ok = await runGraphQL(
            async () => {
                const result = await createComment({
                    postId,
                    body: trimmed,
                })
                return result.data!.createCommunityPostComment
            },
            { showSuccessToast: true },
        )
        if (ok) {
            setBody("")
            // refresh this thread + let the feed bump the post's comment count
            await mutate()
            onChanged?.()
        }
    }, [body, postId, createComment, runGraphQL, mutate, onChanged])

    // refresh the top-level list, and bubble up so the feed bumps the post count
    const onItemChanged = useCallback(() => {
        void mutate()
        onChanged?.()
    }, [mutate, onChanged])

    return (
        <div className="flex flex-col gap-3 border-t border-separator pt-3">
            {authenticated ? (
                <div className="flex flex-col gap-2">
                    <TextField variant="secondary">
                        <TextArea
                            rows={2}
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            placeholder={t("community.comments.placeholder")}
                            aria-label={t("community.comments.placeholder")}
                            className="resize-none"
                        />
                    </TextField>
                    <div className="flex justify-end">
                        <Button
                            variant="primary"
                            size="sm"
                            isPending={isMutating}
                            isDisabled={!body.trim()}
                            onPress={() => void onSubmit()}
                        >
                            {t("community.comments.send")}
                        </Button>
                    </div>
                </div>
            ) : null}

            <AsyncContent
                isLoading={isLoading && comments.length === 0}
                skeleton={(
                    <Typography type="body-xs" color="muted">
                        {t("community.comments.loading")}
                    </Typography>
                )}
                isEmpty={comments.length === 0}
                emptyContent={{ title: t("community.comments.empty") }}
                error={comments.length === 0 ? error : undefined}
                errorContent={{
                    title: t("community.comments.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("community.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {comments.map((comment) => (
                        <CommunityCommentItem
                            key={comment.id}
                            postId={postId}
                            comment={comment}
                            authenticated={authenticated}
                            onChanged={onItemChanged}
                        />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
