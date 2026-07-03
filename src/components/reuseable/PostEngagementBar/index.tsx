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
    ShareNetworkIcon,
    LinkSimpleIcon,
    PaperPlaneTiltIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import type { SavedEntityType, SavedPostSource } from "@/hooks/zustand/savedItems"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { formatCompactCount } from "./format-compact-count"
import type { EngagementActions } from "./actions"

export * from "./actions"
export { formatCompactCount } from "./format-compact-count"

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
    /** Absolute URL of the item — required only when `actions.share` is enabled. */
    postUrl?: string
    /** Title used for the native share sheet (falls back to the URL). */
    shareTitle?: string
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
 * copy-link and native share stay open to guests.
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
    postUrl,
    shareTitle,
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
        } catch {
            toast.danger(t("engagement.linkCopyFailed"))
        }
    }, [postUrl, t])

    /** Open the native share sheet; swallow a user cancel (AbortError). */
    const onNativeShare = useCallback(async () => {
        if (!postUrl || !navigator.share) {
            return
        }
        try {
            await navigator.share({ title: shareTitle ?? postUrl, url: postUrl })
        } catch (error) {
            // user cancelled the share sheet — not an error
            if (error instanceof Error && error.name === "AbortError") {
                return
            }
        }
    }, [postUrl, shareTitle])

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
        </div>
    )
}
