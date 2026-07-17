"use client"

import React from "react"
import { Button, cn } from "@heroui/react"
import { HeartIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { getTimeAgoLabel, getTimeAgoMessage } from "@/modules/dayjs"
import { UserLink } from "@/components/features/identity"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { BlogCommentResponse } from "@/modules/api/rest/blog"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CommentComposer } from "./CommentComposer"

/** Props for {@link CommentItem}. */
export interface CommentItemProps extends WithClassNames<undefined> {
    /** The comment to render. */
    comment: BlogCommentResponse
    /** Current viewer id (drives the owner-only edit/delete affordances); null for guests. */
    currentUserId: string | null
    /**
     * The viewer's reaction state on this comment: `true`/`false` after a toggle,
     * `undefined` before the first toggle (the BE GET does not report it) → neutral heart.
     */
    reacted?: boolean
    /** True when this row's inline edit composer is open. */
    isEditing?: boolean
    /** True while this comment's update mutation is in flight. */
    isSavingEdit?: boolean
    /** True while this comment's reaction toggle is in flight (disables the heart, blocks double-toggle). */
    isReacting?: boolean
    /** Toggle the viewer's reaction on this comment (guarded upstream for guests). */
    onToggleReaction: (comment: BlogCommentResponse) => void
    /** Open the inline edit composer for this comment (owner only). */
    onStartEdit: (comment: BlogCommentResponse) => void
    /** Close the inline edit composer. */
    onCancelEdit: () => void
    /** Submit the edited body; resolves `true` on success (composer closes). */
    onSubmitEdit: (comment: BlogCommentResponse, text: string) => Promise<boolean>
    /** Request deletion of this comment (opens the shared confirm modal; owner only). */
    onRequestDelete: (comment: BlogCommentResponse) => void
}

/**
 * One flat blog comment row: avatar on the left, then author · relative time
 * (with an "edited" suffix when the body was changed), the plain-text body, and a
 * thin action line — a heart toggle with its count plus owner-only Edit/Delete.
 *
 * The author renders through {@link UserLink} (avatar + hovercard + profile link)
 * when `authorUsername` is resolved, and falls back to a {@link UserAvatar} seeded
 * by `userId` with a localized generic label when it is null (legacy id / older
 * BE) — never a raw id. Presentational: all data + gating is owned by the parent.
 * @param props - {@link CommentItemProps}
 */
export const CommentItem = ({
    comment,
    currentUserId,
    reacted,
    isEditing,
    isSavingEdit,
    isReacting,
    onToggleReaction,
    onStartEdit,
    onCancelEdit,
    onSubmitEdit,
    onRequestDelete,
    className,
}: CommentItemProps) => {
    const t = useTranslations("blog.engagement")
    // relative-time keys are ROOT-level ("timeAgo.*"); resolve them with a root
    // translator, not the namespaced one (which would prefix "blog.engagement.").
    const tRoot = useTranslations()

    const isOwn = currentUserId !== null && currentUserId === comment.userId
    const hasAuthor = Boolean(comment.authorUsername)
    // updatedAt strictly after createdAt means the body was edited at least once
    const isEdited = new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime()

    return (
        <div className={cn("flex items-start gap-3", className)}>
            {hasAuthor ? (
                <UserLink
                    username={comment.authorUsername}
                    seed={comment.userId}
                    size="sm"
                    hideName
                    className="mt-0.5 shrink-0"
                    classNames={{ avatar: "size-8" }}
                />
            ) : (
                <UserAvatar seed={comment.userId} size="sm" className="mt-0.5 size-8 shrink-0" />
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                {/* header line: author · relative time · edited */}
                <div className="flex flex-wrap items-center gap-2">
                    {hasAuthor ? (
                        <UserLink username={comment.authorUsername} size="sm" showAvatar={false} />
                    ) : (
                        <span className="text-sm font-medium text-foreground">
                            {t("anonymous")}
                        </span>
                    )}
                    <span className="text-xs text-muted">
                        {getTimeAgoLabel(getTimeAgoMessage(comment.createdAt), tRoot)}
                    </span>
                    {isEdited ? (
                        <span className="text-xs text-muted" aria-hidden>
                            · {t("edited")}
                        </span>
                    ) : null}
                </div>

                {isEditing ? (
                    <CommentComposer
                        placeholder={t("commentPlaceholder")}
                        submitLabel={t("save")}
                        cancelLabel={t("cancel")}
                        initialValue={comment.content}
                        onSubmit={(text) => onSubmitEdit(comment, text)}
                        onCancel={onCancelEdit}
                        isSubmitting={Boolean(isSavingEdit)}
                        autoFocus
                    />
                ) : (
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {comment.content}
                    </p>
                )}

                {/* thin action line: heart toggle + owner-only edit/delete */}
                {isEditing ? null : (
                    <div className="flex flex-wrap items-center gap-4 pt-0.5">
                        <button
                            type="button"
                            aria-pressed={reacted === true}
                            aria-label={reacted === true ? t("commentUnlike") : t("commentLike")}
                            disabled={isReacting}
                            onClick={() => onToggleReaction(comment)}
                            className={cn(
                                "flex items-center gap-1.5 transition-colors",
                                reacted === true
                                    ? "text-danger"
                                    : "text-muted hover:text-danger",
                                isReacting && "pointer-events-none opacity-60",
                            )}
                        >
                            <HeartIcon
                                aria-hidden
                                focusable="false"
                                className="size-4"
                                weight={reacted === true ? "fill" : "regular"}
                            />
                            <span className="text-xs" aria-hidden>
                                {comment.emojiCount}
                            </span>
                            <span className="sr-only">
                                {t("likeCount", { count: comment.emojiCount })}
                            </span>
                        </button>

                        {isOwn ? (
                            <>
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    className="h-auto min-w-0 px-1 py-0 text-xs text-muted hover:text-accent"
                                    onPress={() => onStartEdit(comment)}
                                >
                                    {t("edit")}
                                </Button>
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    className="h-auto min-w-0 px-1 py-0 text-xs text-muted hover:text-danger"
                                    onPress={() => onRequestDelete(comment)}
                                >
                                    {t("delete")}
                                </Button>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}
