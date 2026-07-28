"use client"

import React, { useCallback } from "react"
import {
    Button,
    Dropdown,
    Label,
    cn,
    toast,
} from "@heroui/react"
import {
    HeartIcon,
    ChatCircleIcon,
    ChatCircleDotsIcon,
    ShareNetworkIcon,
    LinkSimpleIcon,
    PaperPlaneTiltIcon,
    RepeatIcon,
    FacebookLogoIcon,
    XLogoIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import type { SavedEntityType, SavedPostSource } from "@/hooks/zustand/savedItems"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { formatCompactCount } from "./format-compact-count"
import type { EngagementActions } from "./actions"
import { PostActionsMenu } from "./PostActionsMenu"

export * from "./actions"
export * from "./report-reasons"
export { formatCompactCount } from "./format-compact-count"
export { PostActionsMenu, type PostActionsMenuProps } from "./PostActionsMenu"
export { ReportDialog, type ReportDialogProps } from "./ReportDialog"
export { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog"

/**
 * Kênh chia sẻ dạng **web-intent**: chỉ là một URL mở ở tab mới — KHÔNG SDK,
 * KHÔNG script bên thứ ba. Mỗi mạng tự đọc OG tag của `postUrl`, nên không cần
 * gửi gì thêm ngoài link (X nhận thêm `text` = tiêu đề bài).
 */
const SHARE_CHANNELS: readonly {
    id: string
    channel: "FACEBOOK" | "X" | "ZALO"
    labelKey: string
    Icon: React.ComponentType<{ className?: string }>
    buildUrl: (url: string, title: string) => string
}[] = [
    {
        id: "share-facebook",
        channel: "FACEBOOK",
        labelKey: "engagement.shareFacebook",
        Icon: FacebookLogoIcon,
        buildUrl: (url) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        id: "share-x",
        channel: "X",
        labelKey: "engagement.shareX",
        Icon: XLogoIcon,
        buildUrl: (url, title) =>
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
        id: "share-zalo",
        channel: "ZALO",
        // Zalo không có logo trong phosphor → dùng icon chat cho gần nghĩa nhất
        labelKey: "engagement.shareZalo",
        Icon: ChatCircleDotsIcon,
        // sp.zalo.me/plugins/share là đường share web của Zalo (đo 2026-07-28: 200).
        // KHÔNG dùng zalo.me/share/link — 302 về zalo.me/nf, tức trang không tồn tại.
        buildUrl: (url) => `https://sp.zalo.me/plugins/share?url=${encodeURIComponent(url)}`,
    },
]

/** Props for {@link PostEngagementBar}. */
export interface PostEngagementBarProps extends WithClassNames<undefined> {
    /** Which of like/comment/share/save render (per-surface matrix; all default true). */
    actions?: EngagementActions
    /** Current like count. */
    likes: number
    /** Whether the current user has liked the item. */
    liked: boolean
    /** Current comment count. */
    commentsCount: number
    /** Toggle-like callback (feature owns the optimistic mutation + gating). */
    onToggleLike: () => void
    /**
     * Comment disclosure toggle used on FEED surfaces (expands the inline thread).
     * When provided with `commentsExpanded`, the 💬 button is a disclosure button.
     */
    onToggleComments?: () => void
    /** Whether the inline comment thread is currently expanded (feed surfaces). */
    commentsExpanded?: boolean
    /** DOM id of the expanded comment region (for `aria-controls`). */
    commentsRegionId?: string
    /** Detail-page variant: focuses the composer instead of toggling a thread. */
    onCommentClick?: () => void
    /**
     * Repost/quote affordance (C-1). When provided a 🔁 button renders after the
     * comment button and opens the composer in quote mode with this post. Omit it
     * on surfaces without a repost flow (e.g. discussion).
     */
    onRepost?: () => void
    /** Absolute URL of the item — required only when `actions.share` is enabled. */
    postUrl?: string
    /** Title used for the native share sheet (falls back to the URL). */
    shareTitle?: string
    /**
     * Fired ONLY after a share actually succeeded (link copied, a web-intent tab
     * opened, or the native sheet resolved without an `AbortError`). The feature
     * records the share server-side (`POST /community/posts/{id}/shares`)
     * fire-and-forget; a user who cancels the sheet or a failed copy never counts.
     */
    onShared?: (channel: "COPY_LINK" | "NATIVE" | "FACEBOOK" | "X" | "ZALO") => void
    /**
     * Whether the viewer authored this item — gates the ⋯ menu's owner-only
     * entries ("Sửa" / "Xoá"); a non-owner gets "Báo cáo" instead.
     */
    isOwner?: boolean
    /** Open the edit flow (owner). Omit to leave the entry out of the ⋯ menu. */
    onEdit?: () => void
    /** Start the delete flow (owner). Omit to leave the entry out of the ⋯ menu. */
    onDelete?: () => void
    /** Open the report dialog (non-owner). Omit to leave the entry out. */
    onReport?: () => void
    /** Save entity kind — required only when `actions.save` is enabled. */
    saveEntityType?: SavedEntityType
    /** Save entity id — required only when `actions.save` is enabled. */
    saveEntityId?: string
    /** Post-only save source context captured at save time. */
    saveSource?: SavedPostSource
    /**
     * Threads-style zero suppression: a count of 0 renders nothing next to its
     * icon (the icon stays). Opt-in — default false so existing surfaces keep
     * showing "0".
     */
    hideZeroCounts?: boolean
}

/**
 * Shared Threads-style engagement bar for EVERY post-like surface — community
 * feed rows, post detail, group feed, articles/blog, group discussion, and the
 * subject "Thảo luận" tab. ONE thin borderless/fill-less row directly under the
 * content, in order: ♥ like (+count) · 💬 comment (+count) · 🔁 share · 🔖 save.
 *
 * Which buttons render is governed by the `actions` matrix (all default true;
 * discussion passes `DISCUSSION_ENGAGEMENT_ACTIONS` to drop share + save). When
 * `actions.share`/`actions.save` is false the corresponding URL / save wiring is
 * skipped entirely, so discussion surfaces need no post URL or save contract.
 *
 * Active states: filled red heart when liked, filled bookmark when saved
 * (the bookmark is the shared {@link SaveButton}). Every button stops event
 * propagation so a press inside a wrapping card `<Link>` never navigates.
 *
 * Guest gating (like/comment/save) lives in the feature callbacks / SaveButton;
 * copy-link, the {@link SHARE_CHANNELS} web-intents (Facebook · X · Zalo — plain
 * links, no SDK) and native share stay open to guests.
 *
 * A trailing ⋯ menu ({@link PostActionsMenu}) appears when the surface passes
 * ownership callbacks: "Sửa"/"Xoá" for the author, "Báo cáo" for everyone else.
 * A share that actually happened (link copied / native sheet resolved) calls
 * `onShared` so the feature can record it server-side — a cancelled sheet or a
 * failed copy never does.
 *
 * @param props - {@link PostEngagementBarProps}
 */
export const PostEngagementBar = ({
    actions,
    likes,
    liked,
    commentsCount,
    onToggleLike,
    onToggleComments,
    commentsExpanded = false,
    commentsRegionId,
    onCommentClick,
    onRepost,
    postUrl,
    shareTitle,
    onShared,
    isOwner,
    onEdit,
    onDelete,
    onReport,
    saveEntityType,
    saveEntityId,
    saveSource,
    hideZeroCounts = false,
    className,
}: PostEngagementBarProps) => {
    const t = useTranslations("communityHub")
    const locale = useLocale()

    const showLike = actions?.like ?? true
    const showComment = actions?.comment ?? true
    const showShare = actions?.share ?? true
    const showSave = actions?.save ?? true

    const canNativeShare =
        typeof navigator !== "undefined" && typeof navigator.share === "function"

    /** Prevent a press from bubbling into / navigating a wrapping card link. */
    const stop = (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }

    const onLike = useCallback(() => onToggleLike(), [onToggleLike])

    const onComment = useCallback(() => {
        if (onToggleComments) {
            onToggleComments()
            return
        }
        onCommentClick?.()
    }, [onToggleComments, onCommentClick])

    /** Copy the item URL to the clipboard (with an execCommand fallback). */
    const onCopyLink = useCallback(async () => {
        if (!postUrl) {
            return
        }
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(postUrl)
            } else {
                const textarea = document.createElement("textarea")
                textarea.value = postUrl
                textarea.style.position = "fixed"
                textarea.style.opacity = "0"
                document.body.appendChild(textarea)
                textarea.select()
                document.execCommand("copy")
                document.body.removeChild(textarea)
            }
            toast.success(t("engagement.linkCopied"))
            // the link really left the app → record the share (fire-and-forget)
            onShared?.("COPY_LINK")
        } catch {
            toast.danger(t("engagement.linkCopyFailed"))
        }
    }, [postUrl, t, onShared])

    /** Mở kênh web-intent ở tab mới; ghi nhận share y như "sao chép liên kết". */
    const onShareChannel = useCallback(
        (channel: (typeof SHARE_CHANNELS)[number]) => {
            if (!postUrl) {
                return
            }
            // Popup bị chặn → window.open trả null. Chỉ ghi nhận lượt share khi cửa sổ kênh
            // MỞ ĐƯỢC THẬT, đúng tinh thần "sheet bị huỷ thì không tính" của native share.
            const opened = window.open(
                channel.buildUrl(postUrl, shareTitle ?? postUrl),
                "_blank",
                "noopener,noreferrer",
            )
            if (!opened) {
                return
            }
            onShared?.(channel.channel)
        },
        [postUrl, shareTitle, onShared],
    )

    /** Open the native share sheet; swallow a user cancel (AbortError). */
    const onNativeShare = useCallback(async () => {
        if (!postUrl || !navigator.share) {
            return
        }
        try {
            await navigator.share({ title: shareTitle ?? postUrl, url: postUrl })
            onShared?.("NATIVE")
        } catch (error) {
            // user cancelled the share sheet — not an error, and NOT a share
            if (error instanceof Error && error.name === "AbortError") {
                return
            }
        }
    }, [postUrl, shareTitle, onShared])

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {showLike ? (
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-pressed={liked}
                    aria-label={liked ? t("engagement.unlike") : t("engagement.like")}
                    className="gap-1"
                    onPress={onLike}
                    onClick={stop}
                >
                    <HeartIcon
                        aria-hidden
                        focusable="false"
                        className={cn("size-5", liked && "text-danger")}
                        weight={liked ? "fill" : "regular"}
                    />
                    {hideZeroCounts && likes === 0 ? null : (
                        <span className="text-xs tabular-nums text-muted">
                            {formatCompactCount(likes, locale)}
                        </span>
                    )}
                </Button>
            ) : null}

            {showComment ? (
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("engagement.comment")}
                    aria-expanded={onToggleComments ? commentsExpanded : undefined}
                    aria-controls={onToggleComments ? commentsRegionId : undefined}
                    className="gap-1"
                    onPress={onComment}
                    onClick={stop}
                >
                    <ChatCircleIcon aria-hidden focusable="false" className="size-5" />
                    {hideZeroCounts && commentsCount === 0 ? null : (
                        <span className="text-xs tabular-nums text-muted">
                            {formatCompactCount(commentsCount, locale)}
                        </span>
                    )}
                </Button>
            ) : null}

            {onRepost ? (
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("engagement.repost")}
                    onPress={onRepost}
                    onClick={stop}
                >
                    <RepeatIcon aria-hidden focusable="false" className="size-5" />
                </Button>
            ) : null}

            {showShare && postUrl ? (
                <span className="inline-flex" onClick={stop}>
                    <Dropdown>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            aria-label={t("engagement.share")}
                        >
                            <ShareNetworkIcon aria-hidden focusable="false" className="size-5" />
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu>
                                <Dropdown.Section>
                                    <Dropdown.Item
                                        id="copy-link"
                                        textValue={t("engagement.copyLink")}
                                        onPress={() => void onCopyLink()}
                                    >
                                        <LinkSimpleIcon className="size-5" />
                                        <Label>{t("engagement.copyLink")}</Label>
                                    </Dropdown.Item>
                                    {canNativeShare ? (
                                        <Dropdown.Item
                                            id="share-via"
                                            textValue={t("engagement.shareVia")}
                                            onPress={() => void onNativeShare()}
                                        >
                                            <PaperPlaneTiltIcon className="size-5" />
                                            <Label>{t("engagement.shareVia")}</Label>
                                        </Dropdown.Item>
                                    ) : null}
                                </Dropdown.Section>
                                {/* Kênh chia sẻ web-intent — desktop cũng có kênh
                                    thật, không chỉ mỗi "sao chép liên kết" */}
                                <Dropdown.Section>
                                    {SHARE_CHANNELS.map((channel) => (
                                        <Dropdown.Item
                                            key={channel.id}
                                            id={channel.id}
                                            textValue={t(channel.labelKey)}
                                            onPress={() => onShareChannel(channel)}
                                        >
                                            <channel.Icon className="size-5" />
                                            <Label>{t(channel.labelKey)}</Label>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Section>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                </span>
            ) : null}

            {showSave && saveEntityType && saveEntityId ? (
                <SaveButton
                    entityType={saveEntityType}
                    entityId={saveEntityId}
                    source={saveSource}
                />
            ) : null}

            <PostActionsMenu
                isOwner={isOwner}
                onEdit={onEdit}
                onDelete={onDelete}
                onReport={onReport}
                className="ml-auto"
            />
        </div>
    )
}
