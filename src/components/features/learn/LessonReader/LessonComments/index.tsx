"use client"

import React, { useState } from "react"
import { Button, Input, TextField, Typography } from "@heroui/react"
import { ChatCircleIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { UserLink } from "@/components/features/identity"
import { useQueryLessonCommentsSwr } from "../../hooks/useQueryLessonCommentsSwr"
import type { LessonComment } from "../../hooks/useQueryLessonCommentsSwr"

/** Props for {@link LessonComments}. */
export interface LessonCommentsProps {
    courseId: string
    contentId: string
}

/**
 * Per-lesson comment section for the reader. A simple list of comments (avatar +
 * author + time + body) plus a composer. Submitting appends optimistically
 * (session-only — no BE); the composer clears on send.
 *
 * ponytail: mock thread via `useQueryLessonCommentsSwr`; a real BE owns the
 * `lessonComments(contentId)` query + `postLessonComment` mutation. Kept
 * self-contained (own i18n namespace) rather than reusing `PostCommentThread`,
 * which couples to the community-hub i18n + rich editor.
 */
export const LessonComments = ({ courseId, contentId }: LessonCommentsProps) => {
    const t = useTranslations("learn")
    const { comments, isLoading, error, mutate } = useQueryLessonCommentsSwr(courseId, contentId)

    const [draft, setDraft] = useState("")
    // ponytail: session-only optimistic comments (a real BE persists these).
    const [posted, setPosted] = useState<Array<LessonComment>>([])

    const allComments = [...posted, ...comments]

    const onSubmit = () => {
        const body = draft.trim()
        if (body === "") {
            return
        }
        setPosted((prev) => [
            {
                id: `local-${Date.now()}`,
                author: t("comments.you"),
                authorUsername: "you",
                timeLabel: t("comments.now"),
                text: body,
            },
            ...prev,
        ])
        setDraft("")
    }

    return (
        <section className="flex flex-col gap-4 border-t border-separator pt-6">
            <div className="flex items-center gap-2">
                <ChatCircleIcon aria-hidden focusable="false" className="size-5 text-muted" />
                <Typography type="body" weight="semibold">
                    {t("comments.title", { count: allComments.length })}
                </Typography>
            </div>

            {/* composer */}
            <div className="flex items-end gap-2">
                <TextField variant="primary" className="flex-1">
                    <Input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={t("comments.placeholder")}
                        aria-label={t("comments.placeholder")}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault()
                                onSubmit()
                            }
                        }}
                    />
                </TextField>
                <Button
                    variant="primary"
                    isIconOnly
                    aria-label={t("comments.send")}
                    isDisabled={draft.trim() === ""}
                    onPress={onSubmit}
                >
                    <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-5" />
                </Button>
            </div>

            <AsyncContent
                isLoading={isLoading && comments.length === 0}
                skeleton={<CommentsSkeleton />}
                isEmpty={allComments.length === 0}
                emptyContent={{ title: t("comments.empty") }}
                error={comments.length === 0 ? error : undefined}
                errorContent={{
                    title: t("comments.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                <div className="flex flex-col gap-4">
                    {allComments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <UserLink
                                username={comment.authorUsername}
                                displayName={comment.author}
                                hideName
                                size="sm"
                                classNames={{ avatar: "size-8" }}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <UserLink
                                        username={comment.authorUsername}
                                        displayName={comment.author}
                                        showAvatar={false}
                                    />
                                    <Typography type="body-xs" color="muted">
                                        {comment.timeLabel}
                                    </Typography>
                                </div>
                                <Typography type="body-sm">{comment.text}</Typography>
                            </div>
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </section>
    )
}

/** Comment list skeleton — two rows. */
const CommentsSkeleton = () => (
    <div className="flex flex-col gap-4">
        {[0, 1].map((row) => (
            <div key={row} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-3 w-3/4 rounded-md" />
                </div>
            </div>
        ))}
    </div>
)
