"use client"

import React, { useCallback, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { UserLink } from "@/components/features/identity"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    PostEngagementBar,
    DISCUSSION_ENGAGEMENT_ACTIONS,
} from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { PostMediaGrid } from "@/components/blocks/feed/PostMediaGrid"
import { PostImagePicker } from "@/components/blocks/feed/PostImagePicker"
import type { MediaInput } from "@/modules/api/rest/community/types"
import {
    useQuerySubjectFeedSwr,
    type FeedScope,
    type SubjectPost,
} from "../hooks/useQuerySubjectFeedSwr"
import { useQuerySubjectPostCommentsSwr } from "../hooks/useQuerySubjectPostCommentsSwr"
import { useMutateReactSubjectPostSwr } from "../hooks/useMutateReactSubjectPostSwr"
import { useMutateCreateSubjectPostSwr } from "../hooks/useMutateCreateSubjectPostSwr"
import { useMutateCreateSubjectPostCommentSwr } from "../hooks/useMutateCreateSubjectPostCommentSwr"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"

/** Feed scope tabs. */
const SCOPES: Array<FeedScope> = ["forYou", "following", "trending"]

/** One "Thảo luận" post row + inline comment thread. Like + comment ONLY. */
const SubjectPostRow = ({
    subjectId,
    scope,
    post,
}: {
    subjectId: string
    scope: FeedScope
    post: SubjectPost
}) => {
    const tHub = useTranslations("communityHub")
    const locale = useLocale()
    const currentUser = useAppSelector((state) => state.user.user)
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactPost = useMutateReactSubjectPostSwr(subjectId, scope)
    const submitComment = useMutateCreateSubjectPostCommentSwr(subjectId, scope)
    const { thread, isLoading, error, mutate } = useQuerySubjectPostCommentsSwr(
        subjectId,
        post.id,
        hasOpened,
        scope,
    )

    const regionId = `post-comments-${post.id}`

    const onToggleComments = useCallback(() => {
        setHasOpened(true)
        setExpanded((prev) => !prev)
    }, [])

    // The comment is written through the community REST API (the GraphQL gateway is read-only);
    // the hook owns the optimistic append + rollback on the discussion thread cache.
    const onSubmit = useCallback(
        async (body: string, parentCommentId?: string): Promise<boolean> =>
            submitComment({
                postId: post.id,
                body,
                authorLabel: locale === "vi" ? "Bạn" : "You",
                authorUsername: currentUser?.username ?? "you",
                justNowLabel: locale === "vi" ? "vừa xong" : "just now",
                parentCommentId,
            }),
        [submitComment, post.id, locale, currentUser],
    )

    return (
        <div className="flex flex-col rounded-2xl border border-separator">
            <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-3">
                    <UserLink
                        username={post.authorUsername}
                        displayName={post.author}
                        hideName
                        size="sm"
                        classNames={{ avatar: "size-8" }}
                    />
                    <UserLink username={post.authorUsername} displayName={post.author} showAvatar={false} />
                    <Typography type="body-xs" color="muted">
                        {post.timeLabel}
                    </Typography>
                </div>
                <Typography type="body" weight="medium">
                    {post.title}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {post.snippet}
                </Typography>
                <PostMediaGrid media={post.media} imageAlt={tHub("composer.imageAlt")} />
                {/* discussion = like + comment ONLY — no share, no save */}
                <PostEngagementBar
                    className="pt-1"
                    actions={DISCUSSION_ENGAGEMENT_ACTIONS}
                    likes={post.reactions}
                    liked={post.liked}
                    commentsCount={post.comments}
                    onToggleLike={() => void reactPost(post.id)}
                    onToggleComments={onToggleComments}
                    commentsExpanded={expanded}
                    commentsRegionId={regionId}
                />
            </div>
            {expanded ? (
                <div className="px-4 pb-4">
                    <PostCommentThread
                        regionId={regionId}
                        comments={thread?.comments ?? []}
                        isLoading={isLoading && !thread}
                        hasError={!thread ? Boolean(error) : false}
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

/** Discussion composer — title + body + images, publishing into the current subject. */
const SubjectComposer = ({ subjectId, scope }: { subjectId: string; scope: FeedScope }) => {
    const t = useTranslations("subjects")
    const tHub = useTranslations("communityHub")
    const submitPost = useMutateCreateSubjectPostSwr(subjectId, scope)
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [media, setMedia] = useState<Array<MediaInput>>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [imagesResetToken, setImagesResetToken] = useState(0)

    const onImagesChange = useCallback((next: Array<MediaInput>) => setMedia(next), [])
    const onUploadingChange = useCallback((uploading: boolean) => setIsUploading(uploading), [])

    // No subject uuid yet → the post would have nothing to anchor to; an in-flight image
    // upload → the post would publish without it.
    const canSubmit =
        Boolean(subjectId) &&
        title.trim() !== "" &&
        body.trim() !== "" &&
        !isSubmitting &&
        !isUploading

    const onSubmit = useCallback(async () => {
        setIsSubmitting(true)
        const ok = await submitPost({ title: title.trim(), content: body.trim(), media })
        setIsSubmitting(false)
        if (ok) {
            setTitle("")
            setBody("")
            setMedia([])
            setImagesResetToken((token) => token + 1)
        }
    }, [submitPost, title, body, media])

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <Typography type="body-sm" weight="semibold">
                {t("community.compose")}
            </Typography>
            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("community.titleField")}
                className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
            <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t("community.bodyField")}
                rows={3}
                className="w-full resize-none rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
            <PostImagePicker
                onChange={onImagesChange}
                onUploadingChange={onUploadingChange}
                resetToken={imagesResetToken}
            />
            <Button
                size="sm"
                variant="secondary"
                className="self-start"
                isDisabled={!canSubmit}
                isPending={isSubmitting}
                onPress={onSubmit}
            >
                {tHub("composer.submit")}
            </Button>
        </div>
    )
}

/**
 * Subject workspace "Thảo luận" tab (renamed by subject-workspace-ia). A scope
 * filter over post rows carrying the shared engagement bar configured for
 * DISCUSSION (like + comment ONLY — no share, no save) with inline push-down
 * comment expansion. Reads go through `subjectWorkspace.community` (GraphQL); writes —
 * publishing a post and adding a comment — go through the community REST API, since a
 * discussion post IS a community post anchored to the subject.
 */
export const SubjectCommunity = () => {
    const t = useTranslations("subjects")
    const { subjectId: code } = useParams<{ subjectId: string }>()
    const [scope, setScope] = useState<FeedScope>("forYou")
    // The route segment is the course code, but `subjectWorkspace.community` (GraphQL)
    // keys on the subject UUID — resolve it via the detail fetch before querying the feed.
    const { subject, isLoading: subjectLoading } = useQuerySubjectSwr(code)
    const subjectId = subject?.uuid ?? ""
    const { posts, isLoading: feedLoading, error, mutate } = useQuerySubjectFeedSwr(subjectId, scope)
    const isLoading = subjectLoading || feedLoading

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* scope filter — static chrome, stays outside the skeleton */}
            <div className="flex flex-col gap-3">
                <Typography type="h5" weight="bold">
                    {t("community.title")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                    {SCOPES.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={scope === item ? "secondary" : "ghost"}
                            onPress={() => setScope(item)}
                        >
                            {t(`community.scopes.${item}`)}
                        </Button>
                    ))}
                </div>
            </div>

            <SubjectComposer subjectId={subjectId} scope={scope} />

            <AsyncContent
                isLoading={isLoading && posts.length === 0}
                skeleton={<FeedSkeleton />}
                isEmpty={posts.length === 0}
                emptyContent={{ title: t("community.empty") }}
                error={posts.length === 0 ? error : undefined}
                errorContent={{
                    title: t("community.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("community.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {posts.map((post) => (
                        <SubjectPostRow
                            key={post.id}
                            subjectId={subjectId}
                            scope={scope}
                            post={post}
                        />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}

/** Loading skeleton — mirrors the discussion post rows. */
const FeedSkeleton = () => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
        ))}
    </div>
)
