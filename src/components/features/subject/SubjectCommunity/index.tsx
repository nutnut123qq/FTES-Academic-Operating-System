"use client"

import React, { useCallback, useState } from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { DISCUSSION_ENGAGEMENT_ACTIONS } from "@/components/reuseable/PostEngagementBar"
// FeedSkeleton đi kèm CommunityFeedRow: cùng render một giải phẫu card, nên phải là CÙNG MỘT
// khối — bản sao riêng ở đây sẽ đứng im khi card bên kia đổi và tab môn nhảy khung khi tải xong.
import { CommunityFeedRow, FeedSkeleton } from "@/components/features/community/CommunityFeed"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"
import { splitTitleFromMarkdown } from "@/components/reuseable/RichTextEditor/title"
import { PostImagePicker } from "@/components/blocks/feed/PostImagePicker"
import type { MediaInput } from "@/modules/api/rest/community/types"
import { useQuerySubjectFeedSwr, type FeedScope } from "../hooks/useQuerySubjectFeedSwr"
import { useMutateCreateSubjectPostSwr } from "../hooks/useMutateCreateSubjectPostSwr"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"

/**
 * Discussion composer — single body editor + images, publishing into the current subject.
 * Rendered as the body of the composer MODAL, so it carries no surface of its own
 * (`Modal.Dialog` already owns the border/padding) and no heading (that is the modal header).
 */
const SubjectComposer = ({
    subjectId,
    onSubmitted,
}: {
    subjectId: string
    /** Called after a post really landed — the modal closes on it. */
    onSubmitted?: () => void
}) => {
    const t = useTranslations("subjects")
    const tHub = useTranslations("communityHub")
    const submitPost = useMutateCreateSubjectPostSwr(subjectId)
    const [body, setBody] = useState("")
    const [media, setMedia] = useState<Array<MediaInput>>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [imagesResetToken, setImagesResetToken] = useState(0)

    const onImagesChange = useCallback((next: Array<MediaInput>) => setMedia(next), [])
    const onUploadingChange = useCallback((uploading: boolean) => setIsUploading(uploading), [])

    // No subject uuid yet → the post would have nothing to anchor to; an in-flight image
    // upload → the post would publish without it. No separate title: the leading H1 is
    // the title (derived and stripped from the body on submit).
    const canSubmit =
        Boolean(subjectId) &&
        body.trim() !== "" &&
        !isSubmitting &&
        !isUploading

    const onSubmit = useCallback(async () => {
        setIsSubmitting(true)
        const { title, body: content } = splitTitleFromMarkdown(body)
        const ok = await submitPost({ title, content, media })
        setIsSubmitting(false)
        if (ok) {
            setBody("")
            setMedia([])
            setImagesResetToken((token) => token + 1)
            onSubmitted?.()
        }
    }, [submitPost, body, media, onSubmitted])

    return (
        <div className="flex flex-col gap-3">
            <RichTextEditor
                value={body}
                onChange={setBody}
                toolbar="full"
                placeholder={t("community.bodyField")}
                minHeight={120}
                autoFocus
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
 * Subject workspace "Thảo luận" tab (renamed by subject-workspace-ia). The list is the
 * SHARED community feed card ({@link CommunityFeedRow}) — a discussion post IS a community
 * post anchored to the subject, so the tab gets the same detached cards, the same in-place
 * detail modal and the same owner menu as `/community` instead of a second card that drifts.
 * The engagement bar stays on the DISCUSSION preset (like + comment ONLY — no share, no save).
 *
 * Reads go through `subjectWorkspace.community` (GraphQL); writes — publishing a post and
 * adding a comment — go through the community REST API.
 */
export const SubjectCommunity = () => {
    const t = useTranslations("subjects")
    const { subjectId: code } = useParams<{ subjectId: string }>()
    const user = useAppSelector((state) => state.user.user)
    // ponytail: composer mở trong modal, state cục bộ ngay tại đây — chỉ có ĐÚNG MỘT chỗ mở
    // nó, và nó cần `subjectId` (thứ overlay store toàn cục của community không mang được).
    const [isComposerOpen, setComposerOpen] = useState(false)
    // ponytail: bỏ 3 tab lọc (Dành cho bạn / Đang theo dõi / Xu hướng) — thảo luận môn chỉ còn
    // một feed. Giữ `scope` như hằng để chữ ký hook + cache key bên dưới không phải đổi.
    const scope: FeedScope = "forYou"
    // The route segment is the course code, but `subjectWorkspace.community` (GraphQL)
    // keys on the subject UUID — resolve it via the detail fetch before querying the feed.
    const { subject, isLoading: subjectLoading } = useQuerySubjectSwr(code)
    const subjectId = subject?.uuid ?? ""
    const { posts, isLoading: feedLoading, error, mutate } = useQuerySubjectFeedSwr(subjectId, scope)
    const isLoading = subjectLoading || feedLoading

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* heading — static chrome, stays outside the skeleton */}
            <Typography type="h5" weight="bold">
                {t("community.title")}
            </Typography>

            {/* Hàng mở composer, mirror của trigger bên /community: bấm vào là mở modal soạn bài. */}
            <div className="flex items-center gap-3 rounded-2xl border border-default bg-surface px-4 py-4 shadow-sm">
                <UserAvatar
                    size="sm"
                    className="size-9 shrink-0"
                    username={user?.username}
                    avatar={user?.avatar}
                    seed={user?.email ?? user?.username}
                />
                <button
                    type="button"
                    className="min-w-0 flex-1 cursor-text text-left text-sm text-muted"
                    onClick={() => setComposerOpen(true)}
                >
                    {t("community.bodyField")}
                </button>
            </div>

            <Modal isOpen={isComposerOpen} onOpenChange={setComposerOpen}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog>
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <div className="text-2xl font-bold">{t("community.compose")}</div>
                            </Modal.Header>
                            <Modal.Body>
                                <SubjectComposer
                                    subjectId={subjectId}
                                    onSubmitted={() => setComposerOpen(false)}
                                />
                            </Modal.Body>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

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
                        <CommunityFeedRow
                            key={post.id}
                            post={post}
                            actions={DISCUSSION_ENGAGEMENT_ACTIONS}
                        />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
