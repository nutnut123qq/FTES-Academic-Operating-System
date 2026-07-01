"use client"

import React from "react"
import { Button, Label, Spinner, cn } from "@heroui/react"
import { ChatsCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { CommentComposer } from "./CommentComposer"
import { CommentItem } from "./CommentItem"
import { ReactionType, type CommentNode } from "@/modules/api/graphql/queries/types/discussion"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"

export * from "./ReactionBar"
export * from "./ReactionEmoji"
export * from "./FacebookReactionSelector"
export * from "./CommentComposer"
export * from "./CommentItem"
export * from "./InteractionBar"
export * from "./constants"

/** Props for {@link Discussion}. */
export interface DiscussionProps extends WithClassNames<undefined> {
    /** Current viewer id (drives owner-only actions); null when unknown. */
    currentUserId: string | null
    /** Current viewer identity for the composer avatar; null when signed out. */
    currentUser: { username: string, avatar?: string } | null
    /** Top-level comments for the content. */
    comments: Array<CommentNode>
    /** Total top-level comment count (for the heading). */
    total: number
    /** Whether the first page of comments is still loading. */
    isLoading: boolean
    /** Replies keyed by parent comment id (lazily populated). */
    repliesByParent: Record<string, Array<CommentNode>>
    /** Post a new top-level comment. */
    onSubmitComment: (body: string) => void
    /** Post a reply under a parent comment. */
    onReply: (parentId: string, body: string) => void
    /** Edit a comment body (author only). */
    onEdit: (commentId: string, body: string) => void
    /** Soft-delete a comment (author only). */
    onDelete: (commentId: string) => void
    /** React to a comment (null removes the reaction). */
    onReactComment: (commentId: string, type: ReactionType | null) => void
    /** Lazily load the replies of a parent comment. */
    onLoadReplies: (parentId: string) => void
    /** Whether more top-level comment pages remain to load. */
    hasMore?: boolean
    /** Whether the next page is currently loading. */
    isLoadingMore?: boolean
    /** Load the next page of top-level comments. */
    onLoadMore?: () => void
}

/**
 * Bottom-of-lesson discussion zone — FRAMELESS: a label ("Thảo luận · N") above an
 * avatar-led composer and the threaded comment list, sitting directly on the page
 * canvas (no card) so it doesn't stack a second bordered surface under the reading
 * "paper" card. The content reaction picker is NOT here — it lives in the reading-card
 * footer ({@link import("@/components/features/learn/LessonReader/ContentBody/ContentBodyV2/Discussion/ContentReactionBar").ContentReactionBar}).
 *
 * Presentational: receives all data + callbacks from a container; holds no data hooks.
 * @param props - {@link DiscussionProps}
 */
export const Discussion = ({
    currentUserId,
    currentUser,
    comments,
    total,
    isLoading,
    repliesByParent,
    onSubmitComment,
    onReply,
    onEdit,
    onDelete,
    onReactComment,
    onLoadReplies,
    hasMore,
    isLoadingMore,
    onLoadMore,
    className,
}: DiscussionProps) => {
    const t = useTranslations()

    return (
        <section className={cn("flex flex-col gap-3", className)}>
            {/* ── label + composer (related → gap-3) ── */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <ChatsCircleIcon aria-hidden focusable="false" className="size-5 text-muted" />
                    <Label>{t("discussion.title", { count: total })}</Label>
                </div>
                {/* avatar-led composer: collapses to a slim pill until focused */}
                <CommentComposer onSubmit={onSubmitComment} currentUser={currentUser} collapsible />
            </div>

            {/* ── comment list / loading / empty states ── */}
            {isLoading ? (
                <div className="flex justify-center py-6">
                    <Spinner />
                </div>
            ) : comments.length === 0 ? (
                <EmptyContent
                    icon={<ChatsCircleIcon aria-hidden focusable="false" className="size-8 text-muted" />}
                    title={t("discussion.empty")}
                    description={t("discussion.emptyHint")}
                />
            ) : (
                <div className="flex flex-col gap-3">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUserId={currentUserId}
                            depth={0}
                            repliesByParent={repliesByParent}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onReactComment={onReactComment}
                            onLoadReplies={onLoadReplies}
                        />
                    ))}
                    {hasMore ? (
                        <Button
                            variant="tertiary"
                            className="self-center text-sm text-accent"
                            isDisabled={isLoadingMore}
                            onPress={onLoadMore}
                        >
                            {isLoadingMore ? <Spinner size="sm" /> : t("discussion.loadMore")}
                        </Button>
                    ) : null}
                </div>
            )}
        </section>
    )
}
