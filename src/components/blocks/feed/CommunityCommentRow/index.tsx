"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { SealCheckIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { getTimeAgoLabel, getTimeAgoMessage } from "@/modules/dayjs"
import { ReactionBar } from "../ReactionBar"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import type { QueryCommunityCommentNode } from "@/modules/api/graphql/queries/types/community-comments"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { UserAvatar } from "@/components/reuseable/UserAvatar"

/** Props for the {@link CommunityCommentRow} block. */
export interface CommunityCommentRowProps extends WithClassNames<undefined> {
    /** The comment to render. */
    comment: QueryCommunityCommentNode
    /**
     * React handler — pass the chosen emotion, or `null` to remove. Omit to render
     * the reaction bar READ-ONLY (e.g. when the viewer is signed out).
     */
    onReact?: (type: ReactionType | null) => void
    /**
     * Optional actions rendered below the body (e.g. reply / view-replies controls).
     * Supplied by the owning feature so the row stays presentational.
     */
    actions?: React.ReactNode
}

/**
 * One community comment row: avatar + author (with founder badge) + relative time,
 * the markdown body, a reaction bar, and an optional actions slot. Pure block:
 * owns its look; the owning feature supplies data + the react handler + actions.
 *
 * @param props - {@link CommunityCommentRowProps}
 */
export const CommunityCommentRow = ({
    comment,
    onReact,
    actions,
    className,
}: CommunityCommentRowProps) => {
    const t = useTranslations()
    // resolve the display name, falling back to the username when unset
    const displayName = comment.author.displayName || comment.author.username

    return (
        <div className={className}>
            <div className="flex gap-3">
                <UserAvatar
                    username={comment.author.username}
                    avatar={comment.author.avatar}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <Typography type="body-xs" weight="semibold" truncate>
                            {displayName}
                        </Typography>
                        {comment.isFounderAuthor ? (
                            <SealCheckIcon
                                weight="fill"
                                className="size-3.5 shrink-0 text-accent"
                            />
                        ) : null}
                        <Typography type="body-xs" color="muted">
                            {getTimeAgoLabel(getTimeAgoMessage(comment.createdAt), t)}
                        </Typography>
                    </div>
                    <MarkdownContent markdown={comment.body} className="[&_p]:m-0" />
                    <div className="flex items-center gap-3">
                        <ReactionBar
                            count={comment.reactions.total}
                            myReaction={comment.reactions.myReaction}
                            onReact={onReact}
                        />
                        {actions}
                    </div>
                </div>
            </div>
        </div>
    )
}
