"use client"

import React, { useState } from "react"
import { Link, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { getTimeAgoLabel, getTimeAgoMessage } from "@/modules/dayjs"
import { UserAvatar } from "../UserAvatar"
import { ReactionBar } from "./ReactionBar"
import { CommentComposer } from "./CommentComposer"
import { ReactionType, type CommentNode } from "@/modules/api/graphql/queries/types/discussion"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Callbacks shared down the comment tree. */
export interface CommentItemCallbacks {
    /** Post a reply under `parentId`. */
    onReply: (parentId: string, body: string) => void
    /** Edit a comment body (author only). */
    onEdit: (commentId: string, body: string) => void
    /** Soft-delete a comment (author only). */
    onDelete: (commentId: string) => void
    /** React to a comment (null removes the reaction). */
    onReactComment: (commentId: string, type: ReactionType | null) => void
    /** Lazily load the replies of `parentId`. */
    onLoadReplies: (parentId: string) => void
}

/** Props for {@link CommentItem}. */
export interface CommentItemProps extends CommentItemCallbacks, WithClassNames<undefined> {
    /** The comment to render. */
    comment: CommentNode
    /** Current viewer id (drives owner-only actions); null when unknown. */
    currentUserId: string | null
    /** Nesting depth (controls visual indentation). */
    depth: number
    /** Replies keyed by parent comment id (lazily populated by the container). */
    repliesByParent: Record<string, Array<CommentNode>>
}

/**
 * A single threaded comment with author, reactions, owner actions, reply box, and its
 * recursively-rendered replies. Visual indentation is capped so deep threads stay readable.
 *
 * Presentational: owns only transient UI state (editing/replying/expanded); persistence is
 * delegated via the {@link CommentItemCallbacks}.
 * @param props - {@link CommentItemProps}
 */
export const CommentItem = ({
    comment,
    currentUserId,
    depth,
    repliesByParent,
    onReply,
    onEdit,
    onDelete,
    onReactComment,
    onLoadReplies,
    className,
}: CommentItemProps) => {
    const t = useTranslations()
    // transient per-comment UI state
    const [replying, setReplying] = useState(false)
    const [editing, setEditing] = useState(false)
    const [expanded, setExpanded] = useState(false)

    const isOwner = currentUserId !== null && currentUserId === comment.author.id
    const replies = repliesByParent[comment.id] ?? []

    // expand/collapse the reply subtree, loading it on first expand
    const toggleReplies = () => {
        const next = !expanded
        setExpanded(next)
        if (next) {
            onLoadReplies(comment.id)
        }
    }

    return (
        <div
            className={cn(
                "flex flex-col gap-2",
                // indent nested replies with a guide border, capped after a few levels
                depth > 0 ? "border-l border-default pl-3 sm:pl-4" : undefined,
                className,
            )}
        >
            <div className="flex gap-3">
                <UserAvatar
                    size="sm"
                    username={comment.author.username}
                    avatar={comment.author.avatar}
                    className="mt-0.5 shrink-0"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {/* author + timestamp header */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                            {comment.author.username}
                        </span>
                        <span className="text-xs text-muted">
                            {getTimeAgoLabel(getTimeAgoMessage(comment.createdAt), t)}
                        </span>
                        {comment.editedAt ? (
                            <span className="text-xs text-muted">{t("discussion.edited")}</span>
                        ) : null}
                    </div>

                    {/* body, edit form, or deleted placeholder */}
                    {comment.isDeleted ? (
                        <div className="text-sm italic text-muted">{t("discussion.deletedPlaceholder")}</div>
                    ) : editing ? (
                        <CommentComposer
                            initialValue={comment.body}
                            submitLabel={t("common.save")}
                            onCancel={() => setEditing(false)}
                            onSubmit={(body) => {
                                onEdit(comment.id, body)
                                setEditing(false)
                            }}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {comment.body}
                        </div>
                    )}

                    {/* action row: reactions + reply + owner edit/delete */}
                    {!comment.isDeleted && !editing ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <ReactionBar
                                summary={comment.reactions}
                                onReact={(type) => onReactComment(comment.id, type)}
                            />
                            <Link
                                className="cursor-pointer text-xs font-medium text-muted hover:text-foreground"
                                onPress={() => setReplying((prev) => !prev)}
                            >
                                {t("discussion.reply")}
                            </Link>
                            {isOwner ? (
                                <>
                                    <Link
                                        className="cursor-pointer text-xs font-medium text-muted hover:text-foreground"
                                        onPress={() => setEditing(true)}
                                    >
                                        {t("common.edit")}
                                    </Link>
                                    <Link
                                        className="cursor-pointer text-xs font-medium text-muted hover:text-danger"
                                        onPress={() => onDelete(comment.id)}
                                    >
                                        {t("common.delete")}
                                    </Link>
                                </>
                            ) : null}
                        </div>
                    ) : null}

                    {/* reply composer */}
                    {replying ? (
                        <CommentComposer
                            placeholder={t("discussion.replyPlaceholder")}
                            submitLabel={t("discussion.reply")}
                            onCancel={() => setReplying(false)}
                            onSubmit={(body) => {
                                onReply(comment.id, body)
                                setReplying(false)
                                // surface the new reply immediately by expanding the subtree
                                setExpanded(true)
                                onLoadReplies(comment.id)
                            }}
                        />
                    ) : null}

                    {/* replies toggle + recursive subtree */}
                    {comment.replyCount > 0 ? (
                        <Link
                            className="cursor-pointer self-start text-xs font-medium text-accent hover:underline"
                            onPress={toggleReplies}
                        >
                            {expanded
                                ? t("discussion.hideReplies")
                                : t("discussion.viewReplies", { count: comment.replyCount })}
                        </Link>
                    ) : null}

                    {expanded && replies.length > 0 ? (
                        <div className="mt-1 flex flex-col gap-3">
                            {replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    currentUserId={currentUserId}
                                    depth={depth + 1}
                                    repliesByParent={repliesByParent}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onReactComment={onReactComment}
                                    onLoadReplies={onLoadReplies}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
