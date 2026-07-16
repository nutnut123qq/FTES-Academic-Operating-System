"use client"

import React, { useCallback, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    PostEngagementBar,
    DISCUSSION_ENGAGEMENT_ACTIONS,
} from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useQueryGroupThreadsSwr, type GroupThread } from "../hooks/useQueryGroupThreadsSwr"
import {
    useComposeGroupThreadComment,
    useQueryGroupThreadCommentsSwr,
} from "../hooks/useQueryGroupThreadCommentsSwr"
import { useMutateReactGroupThreadSwr } from "../hooks/useMutateReactGroupThreadSwr"
import { useMutateCreateGroupThreadSwr } from "../hooks/useMutateCreateGroupThreadSwr"

/** One discussion thread row + inline (lazy) comment thread. Like + comment ONLY. */
const GroupDiscussionRow = ({ groupId, thread }: { groupId: string; thread: GroupThread }) => {
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactThread = useMutateReactGroupThreadSwr(groupId)
    const { thread: comments, isLoading, error, mutate } = useQueryGroupThreadCommentsSwr(
        groupId,
        thread.id,
        hasOpened,
    )

    const regionId = `post-comments-${thread.id}`

    const onToggleComments = useCallback(() => {
        setHasOpened(true)
        setExpanded((prev) => !prev)
    }, [])

    // real compose: POST discussion comment then revalidate the thread comments
    const onSubmit = useComposeGroupThreadComment(groupId, thread.id, mutate)

    return (
        <div className="flex flex-col rounded-2xl border border-separator transition-colors hover:bg-default/40">
            <div className="flex flex-col gap-2 p-4">
                <div className="min-w-0">
                    <Typography type="body-sm" weight="medium" truncate>
                        {thread.title}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {thread.author}
                    </Typography>
                </div>
                {/* discussion = like + comment ONLY — no share, no save */}
                <PostEngagementBar
                    className="pt-1"
                    actions={DISCUSSION_ENGAGEMENT_ACTIONS}
                    likes={thread.likes}
                    liked={thread.liked}
                    commentsCount={thread.replies}
                    onToggleLike={() => void reactThread(thread.id)}
                    onToggleComments={onToggleComments}
                    commentsExpanded={expanded}
                    commentsRegionId={regionId}
                />
            </div>
            {expanded ? (
                <div className="px-4 pb-4">
                    <PostCommentThread
                        regionId={regionId}
                        comments={comments?.comments ?? []}
                        isLoading={isLoading && !comments}
                        hasError={!comments ? Boolean(error) : false}
                        onRetry={() => void mutate()}
                        onSubmit={onSubmit}
                        onCollapse={onToggleComments}
                        stickyComposerOnMobile
                    />
                </div>
            ) : null}
        </div>
    )
}

/** New-thread composer: title + body → real `createGroupThread`, then reset + collapse. */
const GroupThreadComposer = ({ groupId }: { groupId: string }) => {
    const t = useTranslations("groupsHub")
    const { create } = useMutateCreateGroupThreadSwr(groupId)
    const { requireAuth } = useRequireAuth()
    const runRest = useRestWithToast()
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const onSubmit = async () => {
        if (title.trim() === "" || content.trim() === "" || isSubmitting) {
            return
        }
        if (!requireAuth("auth.context.generic")) {
            return
        }
        setIsSubmitting(true)
        const ok = await runRest(() => create(title.trim(), content.trim()), {
            successMessage: t("discussion.created"),
        })
        setIsSubmitting(false)
        if (ok !== null) {
            setTitle("")
            setContent("")
            setOpen(false)
        }
    }

    if (!open) {
        return (
            <Button size="sm" variant="secondary" className="self-start" onPress={() => setOpen(true)}>
                {t("discussion.newThread")}
            </Button>
        )
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("discussion.titleField")}
                className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
            />
            <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={t("discussion.contentField")}
                rows={3}
                className="w-full resize-none rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
            />
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={title.trim() === "" || content.trim() === ""}
                    isPending={isSubmitting}
                    onPress={() => void onSubmit()}
                >
                    {t("discussion.post")}
                </Button>
                <Button size="sm" variant="ghost" onPress={() => setOpen(false)}>
                    {t("discussion.cancel")}
                </Button>
            </div>
        </div>
    )
}

/** Loading skeleton — mirrors a discussion row (title + author + action row). */
const GroupDiscussionSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
            <div key={index} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <Skeleton.Typography type="body-sm" width="3/4" />
                <Skeleton.Typography type="body-xs" width="1/4" />
                <Skeleton.Typography type="body-xs" width="1/3" />
            </div>
        ))}
    </div>
)

/**
 * Group discussion (§7, change group-social-engagement). Discussion thread rows with
 * the shared engagement bar configured for DISCUSSION (like + comment ONLY) and inline
 * push-down comment expansion. Threads, comments, and reactions are all wired to the
 * real `/groups/{id}/discussion/**` REST API, plus a new-thread composer.
 */
export const GroupDiscussion = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { threads, isLoading, error, mutate } = useQueryGroupThreadsSwr(groupId)

    return (
        <div className="flex flex-col gap-3">
            <GroupThreadComposer groupId={groupId} />
            <AsyncContent
                isLoading={isLoading && threads.length === 0}
                skeleton={<GroupDiscussionSkeleton />}
                isEmpty={threads.length === 0}
                emptyContent={{ title: t("discussion.empty") }}
                error={threads.length === 0 ? error : undefined}
                errorContent={{
                    title: t("discussion.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {threads.map((thread) => (
                        <GroupDiscussionRow key={thread.id} groupId={groupId} thread={thread} />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
