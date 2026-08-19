"use client"

import React, { useCallback, useRef, useState } from "react"
import { Button, Chip, Skeleton, Typography, cn, toast } from "@heroui/react"
import {
    CaretUpIcon,
    CheckCircleIcon,
    HeartIcon,
    XIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { UserLink } from "@/components/features/identity"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
// Straight from the formatter's own module, NOT the PostEngagementBar barrel: the barrel
// pulls the whole bar in (share channels, their icons, the dialogs) for one number formatter,
// which every test rendering a thread would then have to mock.
import { formatCompactCount } from "@/components/reuseable/PostEngagementBar/format-compact-count"
import { RichCommentEditor } from "@/components/reuseable/RichCommentEditor"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar/ConfirmDialog"
import { PostActionsMenu } from "@/components/reuseable/PostEngagementBar/PostActionsMenu"
import { ReportDialog } from "@/components/reuseable/PostEngagementBar/ReportDialog"
import type { ReportReasonCode } from "@/components/reuseable/PostEngagementBar/report-reasons"
import { useMutateReportContentSwr } from "@/components/features/community/CommunityPostDetail/hooks/useMutateReportContentSwr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useAppSelector } from "@/redux/hooks"
import { looksLikeUserId } from "@/utils/avatar"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CommentLoadError, type CommentThreadLabels } from "./comment-load-error"

export type { CommentThreadLabels } from "./comment-load-error"

/**
 * Submit a report for ONE comment. Resolves `true` when the report was accepted
 * (the dialog closes) and `false` otherwise (the draft is kept).
 */
export type ReportCommentHandler = (
    commentId: string,
    reasonCode: ReportReasonCode,
    detail?: string,
) => Promise<boolean>

/**
 * Trạng thái "đang trả lời ai".
 *
 * `target` là hàng người dùng BẤM — ô soạn trả lời mọc ra NGAY DƯỚI hàng đó — còn
 * `parentId` là comment CẤP 1 mà hàng mới sẽ gắn vào: hai thứ này khác nhau khi trả lời
 * một comment con, vì cây giữ đúng 2 cấp. Chính vì thế `mention` mang chuỗi "@Tên " để
 * người đọc biết câu trả lời nhắm vào ai (đúng cách Facebook làm).
 */
interface ReplyTarget {
    /** Hàng được bấm "Trả lời" — ô soạn inline hiện ngay dưới nó. */
    target: PostComment
    /** Id comment cấp 1 nhận hàng mới (chính `target.id` khi bấm ở cấp 1). */
    parentId: string
    /**
     * "@Tên " CHÈN SẴN vào ô soạn (`RichCommentEditor.prefill`), hoặc `""` khi trả lời
     * thẳng comment cấp 1.
     *
     * ponytail: chèn vào ô soạn chứ KHÔNG ghép lúc gửi — ghép lúc gửi thì comment lưu
     * xuống đúng nhưng người dùng không thấy tag đâu cả, cảm giác như chưa bấm reply.
     * Ghép cả hai chỗ thì tag ra hai lần, nên `handleReply` gửi nguyên văn bản nháp.
     *
     * Là TEXT THUẦN, cố ý KHÔNG phải mention node: node `ProfileMention` serialize ra
     * `[@label](/u/<id>)`, mà `PostComment.authorUsername` ở đây không đáng tin cho việc
     * dựng link — mấy bề mặt không join profile degrade nó thành uuid tác giả (xem
     * `isMine`), nên biến nó thành mention sẽ đẻ ra link `/u/<uuid>` chết ở đúng những
     * luồng đó. Tag hiển thị đủ để người đọc biết địa chỉ; link thì không bịa.
     */
    mention: string
}

/** Props for {@link PostCommentThread}. */
export interface PostCommentThreadProps extends WithClassNames<undefined> {
    /** DOM id of the region (referenced by the bar's `aria-controls`). */
    regionId: string
    /** The flat one-level comment list (top-level comments carry `replies`). */
    comments: Array<PostComment>
    /** First-load skeleton state (lazy fetch on expand). */
    isLoading: boolean
    /** Fetch error → inline error + retry (no toast, no collapse). */
    hasError?: boolean
    /**
     * The rejection behind `hasError`. Pass it and the inline error names the real
     * cause (offline / expired session / private post / deleted post / server) and
     * only offers a retry that can succeed — see {@link CommentLoadError}. Omitted
     * → the generic "couldn't load the comments" line with a retry, as before.
     */
    error?: unknown
    /** Re-attempt the comment fetch in place. */
    onRetry?: () => void
    /**
     * Surface-specific wording for the empty + failed states
     * ({@link CommentThreadLabels}). The defaults are written for a community
     * POST ("this post no longer exists…"), which is a lie on a challenge paper
     * or an album picture — any surface that is not a post overrides the lines
     * that name the object. Omitted / partial → the post copy, so existing
     * callers are unchanged.
     */
    labels?: CommentThreadLabels
    /**
     * Submit a comment (top-level or one-level reply). Returns `true` on success
     * (clears the composer) and `false` on failure / blocked guest (keeps the
     * draft). The caller owns optimistic append, gating, and error toasts.
     */
    onSubmit: (body: string, parentCommentId?: string) => Promise<boolean>
    /** Collapse control ("Thu gọn") — omitted on the permanently-open detail page. */
    onCollapse?: () => void
    /** Focus the composer on mount (detail page `#comments` deep link). */
    autoFocus?: boolean
    /** Pin the composer to the bottom of the viewport on mobile while focused. */
    stickyComposerOnMobile?: boolean
    /**
     * Keep the composer against the bottom edge of whatever scrolls around it, at every
     * width — for a thread inside a SCROLLING BOX rather than on a page.
     *
     * The flex split above (list scrolls, composer outside it) only pins the composer when
     * the column has a height to divide. Inside a dialog that scrolls as one piece there is
     * no such height: `flex-1` has nothing to resolve against, so the composer lands after
     * the last comment and the reader must scroll the whole thread before they can type.
     * `sticky` needs no bounded height — it pins against the nearest scrolling ancestor.
     *
     * Off on ordinary pages, where that ancestor is the viewport and a composer glued to
     * the bottom of the screen would follow the reader everywhere.
     */
    stickyComposer?: boolean
    /**
     * Username of the signed-in viewer. A comment whose `authorUsername` matches
     * gets the ⋯ menu's "Sửa" / "Xoá" entries; guests / other users get none —
     * and the "Báo cáo" entry shows on everyone ELSE's comments. Optional: when
     * omitted the thread falls back to the session user in the store.
     */
    currentUsername?: string
    /**
     * Id of the signed-in viewer, for surfaces whose comment mapper has no
     * profile join and degrades `authorUsername` to the raw author id (the group
     * feed / discussion threads do). Without it the owner gate would compare a
     * username against a uuid and never match — so the viewer's OWN comment would
     * wrongly offer "Báo cáo". Defaults to the session user id in the store.
     */
    currentUserId?: string
    /**
     * Save an edited comment body (author only). Resolves `true` on success.
     * Omit to hide the edit affordance entirely.
     */
    onEditComment?: (commentId: string, text: string) => Promise<boolean>
    /** Delete a comment (author only) — the row confirms first. */
    onDeleteComment?: (commentId: string) => void
    /**
     * Id of the comment already marked as the post's accepted answer (QUESTION
     * posts) — that row shows the badge and never offers "Chấp nhận".
     */
    acceptedCommentId?: string
    /**
     * Whether the viewer may accept an answer here (post author + QUESTION post).
     * Only TOP-LEVEL comments can be accepted (BE contract).
     */
    canAcceptAnswer?: boolean
    /** Mark a top-level comment as the post's accepted answer. */
    onAcceptAnswer?: (commentId: string) => void
    /**
     * Override the comment report submission (tests / surfaces with their own
     * moderation wiring). Omitted → the thread reports through the shared
     * `POST /community/reports` hook with `targetType: "COMMENT"`.
     */
    onReportComment?: ReportCommentHandler
    /**
     * Whether the BUILT-IN report path may run here. It posts `targetType:
     * "COMMENT"` with the row id, which only resolves for comments living in the
     * COMMUNITY module. Threads backed by another module (group discussion
     * threads: `/groups/{id}/discussion/threads/{threadId}/comments`) must pass
     * `false` — a report carrying a foreign id would look handled to the
     * moderator while the content stays up. Ignored when `onReportComment` is
     * supplied: that surface owns the wiring.
     */
    canReportComments?: boolean
    /**
     * Persist a like toggle on ONE comment. Resolve = committed; REJECT = the thread rolls
     * the optimistic heart back and toasts. The thread owns the optimistic state, the
     * guest gate and the double-click guard, so a surface only supplies the write.
     *
     * Omitted → no heart is rendered at all. That is the per-surface switch: comment
     * reactions live in three different backends (`community.reactions`,
     * `group_thread_reactions`, `challenge_comment_likes`) and the album-picture thread has
     * none yet, so there is no shared default that could be right everywhere — unlike
     * "Báo cáo", whose community path IS the default (`canReportComments`).
     */
    onToggleCommentLike?: (commentId: string, nextLiked: boolean) => Promise<void>
}

/**
 * Tên hiển thị của tác giả MỘT comment — một chỗ duy nhất quyết, dùng cho cả hàng
 * comment, chip "đang trả lời" và chuỗi auto-tag "@Tên".
 *
 * `author` rỗng (nguồn không có profile join) hoặc bị mapper degrade thành uuid thì
 * trả `fallback` — không bao giờ in uuid ra làm tên người.
 *
 * @param comment - Hàng comment.
 * @param fallback - Tên thay thế khi hàng không mang tên thật.
 * @returns Tên để render.
 */
const resolveAuthorName = (comment: PostComment, fallback: string): string =>
    comment.author && !looksLikeUserId(comment.author) ? comment.author : fallback

/**
 * One comment row (avatar + author + time + body + optional reply affordance).
 * Owner/report actions are NOT spelled out inline — they sit in the shared ⋯
 * {@link PostActionsMenu}, exactly like a post's.
 */
export const CommentRow = ({
    comment,
    onReply,
    replyLabel,
    isReply,
    fallbackName,
    hasThreadline,
    canManage = false,
    onEdit,
    onDelete,
    isAccepted = false,
    canAccept = false,
    onAccept,
    canReport = false,
    onReport,
    liked = false,
    likeCount = 0,
    onToggleLike,
}: {
    comment: PostComment
    onReply?: (comment: PostComment) => void
    replyLabel: string
    isReply?: boolean
    /**
     * Tên dùng khi hàng comment KHÔNG mang tên thật (nguồn không có profile join, hoặc
     * node lạc quan vừa gửi chưa có author card). Chỉ truyền khi biết chắc người viết là
     * ai — trên thực tế là chính người đang đăng nhập; bỏ trống → nhãn "Thành viên" cũ.
     */
    fallbackName?: string
    /**
     * Draw the Threads-style vertical connector under this (top-level) comment's
     * avatar, running down to its replies. Set when the comment has replies.
     */
    hasThreadline?: boolean
    /**
     * Whether the viewer authored this comment — gates the ⋯ menu's "Sửa" / "Xoá"
     * entries (the server re-checks; this is UX only).
     */
    canManage?: boolean
    /**
     * Save an edited body. Resolves `true` on success (the row leaves edit mode)
     * and `false` on failure (the draft is kept).
     */
    onEdit?: (commentId: string, text: string) => Promise<boolean>
    /** Delete this comment after the row's confirm dialog. */
    onDelete?: (commentId: string) => void
    /** Whether this comment is the post's accepted answer (badge). */
    isAccepted?: boolean
    /**
     * Whether the viewer may accept THIS comment as the answer (post author on a
     * QUESTION post, top-level comments only).
     */
    canAccept?: boolean
    /** Mark this comment as the accepted answer. */
    onAccept?: (commentId: string) => void
    /**
     * Whether the viewer may report THIS comment — signed in AND not its author
     * (nobody reports their own comment). The server re-checks; UX gate only.
     */
    canReport?: boolean
    /** Send the report for this comment (the row owns the dialog). */
    onReport?: ReportCommentHandler
    /** Whether the viewer has liked this comment (already reconciled with the pending toggle). */
    liked?: boolean
    /** Like counter to print next to the heart; 0 renders the icon alone. */
    likeCount?: number
    /**
     * Toggle the like on this comment. Omitted → NO heart at all, which is how a surface
     * whose backend has no comment reactions opts out (see `PostCommentThread`).
     */
    onToggleLike?: (comment: PostComment) => void
}) => {
    const t = useTranslations("communityHub")
    const tCommon = useTranslations("common")
    const locale = useLocale()
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(comment.text)
    const [isSaving, setIsSaving] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)

    const startEdit = useCallback(() => {
        setDraft(comment.text)
        setIsEditing(true)
    }, [comment.text])

    const saveEdit = useCallback(async () => {
        const next = draft.trim()
        if (!onEdit || next.length === 0 || isSaving) {
            return
        }
        setIsSaving(true)
        const ok = await onEdit(comment.id, next)
        setIsSaving(false)
        if (ok) {
            setIsEditing(false)
        }
    }, [draft, onEdit, isSaving, comment.id])

    const showManage = canManage && (Boolean(onEdit) || Boolean(onDelete))
    const showReport = canReport && !canManage && Boolean(onReport)
    /**
     * Name actually rendered. Mappers with no profile join leave `author` empty and
     * degrade `authorUsername` to the raw author id (the owner gate needs that id — see
     * `isMine`), so without a label `UserLink` would print the uuid as the commenter's
     * name. `fallbackName` (viewer's own name) wins over the shared "member" label when
     * the caller knows who wrote the row; otherwise the label is unchanged.
     */
    const authorName = resolveAuthorName(comment, fallbackName ?? tCommon("unknownMember"))

    return (
        <div className={cn("flex items-start gap-3", isReply && "ml-9")}>
            {/* avatar column — carries the vertical threadline down to the replies */}
            <div className="flex shrink-0 flex-col items-center self-stretch">
                <UserLink
                    username={comment.authorUsername}
                    displayName={authorName}
                    avatar={comment.authorAvatar}
                    frameCode={comment.authorFrame}
                    hideName
                    size="sm"
                    classNames={{ avatar: "size-8" }}
                />
                {hasThreadline ? (
                    <div aria-hidden className="mt-1 w-0.5 flex-1 rounded-full bg-separator" />
                ) : null}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <UserLink
                        username={comment.authorUsername}
                        displayName={authorName}
                        showAvatar={false}
                        staffRole={comment.authorStaffRole}
                        // Tên người bình luận ĐẬM như tên tác giả bài viết ở CommunityFeed —
                        // mặc định `font-semibold` của UserLink đọc còn mảnh so với thân bình luận.
                        classNames={{ name: "font-bold text-foreground" }}
                    />
                    <Typography type="body-xs" color="muted">
                        {comment.timeLabel}
                    </Typography>
                    {isAccepted ? (
                        <Chip size="sm" variant="soft" color="success">
                            <Chip.Label>{t("engagement.acceptedAnswer")}</Chip.Label>
                        </Chip>
                    ) : null}
                </div>

                {isEditing ? (
                    <div className="mt-1 flex flex-col gap-2">
                        <RichTextEditor
                            value={draft}
                            onChange={setDraft}
                            toolbar="comment"
                            ariaLabel={t("engagement.editComment")}
                            disabled={isSaving}
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="primary"
                                onPress={() => void saveEdit()}
                                isPending={isSaving}
                                isDisabled={isSaving || draft.trim().length === 0}
                            >
                                {t("engagement.saveEdit")}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onPress={() => setIsEditing(false)}
                                isDisabled={isSaving}
                            >
                                {t("engagement.cancel")}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <MarkdownContent markdown={comment.text} />
                )}

                {!isEditing ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        {/* Tym — cùng khuôn với nút tym của BÀI VIẾT (`PostEngagementBar`):
                            cùng icon, cùng `weight="fill"` + `text-danger` khi đã thích, cùng
                            `formatCompactCount`. Chỉ nhỏ hơn một cỡ vì đây là hàng bình luận. */}
                        {onToggleLike ? (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                aria-pressed={liked}
                                aria-label={liked ? t("engagement.unlike") : t("engagement.like")}
                                className="h-auto gap-1 px-0 text-xs"
                                onPress={() => onToggleLike(comment)}
                            >
                                <HeartIcon
                                    aria-hidden
                                    focusable="false"
                                    className={cn("size-4", liked && "text-danger")}
                                    weight={liked ? "fill" : "regular"}
                                />
                                {likeCount > 0 ? (
                                    <span className="text-xs tabular-nums text-muted">
                                        {formatCompactCount(likeCount, locale)}
                                    </span>
                                ) : null}
                            </Button>
                        ) : null}
                        {/* ponytail: bỏ điều kiện `!isReply` — MỌI cấp đều có "Trả lời";
                            cây vẫn phẳng 2 cấp, cha do người gọi quyết (xem `startReply`). */}
                        {onReply ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto px-0 text-xs"
                                onPress={() => onReply(comment)}
                            >
                                {replyLabel}
                            </Button>
                        ) : null}
                        {canAccept && onAccept && !isAccepted ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto px-0 text-xs text-success"
                                onPress={() => onAccept(comment.id)}
                            >
                                <CheckCircleIcon aria-hidden focusable="false" className="size-4" />
                                {t("engagement.acceptAnswer")}
                            </Button>
                        ) : null}
                        {/* "Sửa" / "Xoá" / "Báo cáo" live behind the ⋯ overflow menu — the
                            SAME {@link PostActionsMenu} a post uses. Only "Trả lời" (and the
                            QUESTION-author "Chấp nhận") stay spelled out inline. The gate is
                            unchanged: the menu shows the owner entries only to the author and
                            the report entry only to everybody else, and renders nothing at all
                            when no entry is available. */}
                        <PostActionsMenu
                            isOwner={canManage}
                            onEdit={onEdit ? startEdit : undefined}
                            onDelete={onDelete ? () => setConfirmOpen(true) : undefined}
                            onReport={showReport ? () => setReportOpen(true) : undefined}
                        />
                    </div>
                ) : null}

                {showManage && onDelete ? (
                    <ConfirmDialog
                        isOpen={confirmOpen}
                        onClose={() => setConfirmOpen(false)}
                        onConfirm={() => {
                            setConfirmOpen(false)
                            onDelete(comment.id)
                        }}
                        title={t("engagement.deleteCommentTitle")}
                        description={t("engagement.deleteCommentConfirm")}
                    />
                ) : null}

                {showReport && onReport ? (
                    <ReportDialog
                        isOpen={reportOpen}
                        onClose={() => setReportOpen(false)}
                        onSubmit={(reasonCode, detail) => onReport(comment.id, reasonCode, detail)}
                    />
                ) : null}
            </div>
        </div>
    )
}

/**
 * Inline expandable comment region shared by every feed's push-down expansion
 * AND the post detail's comments section (detail renders it permanently open).
 * Renders the comment list (flat one-level replies) + the composer, in document
 * flow (pure push-down — no overlay, no fixed height).
 *
 * States: `isLoading` → skeleton comment rows; `hasError` → inline localized
 * error (in place, no collapse) that names the CAUSE when the caller also passes
 * the `error` itself and offers only the action that can fix it (retry / sign in
 * / nothing) — see {@link CommentLoadError}; otherwise the thread + composer. The
 * wording of those two non-conversation states defaults to community-POST copy and
 * is overridable per surface through `labels` ({@link CommentThreadLabels}), which
 * a thread hanging off a challenge paper or an album picture must use — its object
 * is not a post. The composer
 * has an empty-input guard and draft-preserving failure handling (the caller's
 * `onSubmit` returns `false` to keep the text). On mobile the composer sticks to
 * the bottom of the viewport while focused when `stickyComposerOnMobile` is set.
 *
 * **Ô soạn đáy = bình luận MỚI; trả lời có ô RIÊNG.** Bấm "Trả lời" mở một
 * {@link RichCommentEditor} thứ hai NGAY DƯỚI hàng vừa bấm (`replyComposerFor`) — đúng
 * chỗ câu trả lời sẽ xuất hiện — thay vì đẩy người dùng xuống ô đáy. Mỗi lúc chỉ một ô
 * mở (state `replyTo` là một chỗ duy nhất): bấm "Trả lời" ở hàng khác thì ô cũ đóng, nút
 * ✕ và phím Esc đóng sạch.
 *
 * **"Trả lời" ở MỌI cấp, cây vẫn phẳng 2 cấp.** Comment con cũng có nút trả lời, nhưng
 * hàng mới KHÔNG lồng sâu thêm — nó gắn vào đúng comment cấp 1 của nhánh đó
 * (`onSubmit(body, rootId)`), giống Facebook. Đổi lại, ô soạn được CHÈN SẴN "@Tên " của
 * người được trả lời (`RichCommentEditor.prefill`) để câu trả lời không mất địa chỉ —
 * người dùng nhìn thấy tag ngay trong ô và sửa/xoá được ({@link ReplyTarget}).
 *
 * Per-comment affordances (all opt-in via callbacks, so surfaces that pass none
 * render exactly as before) all live in the row's ⋯ {@link PostActionsMenu} —
 * only "Trả lời" (and the accept-answer action) stays inline: the viewer's OWN
 * comments (`authorUsername === currentUsername`) get "Sửa" (a rich editor, draft
 * kept on failure) and "Xoá" (confirm dialog); on a QUESTION post the post author
 * can accept a TOP-LEVEL comment as the answer, and the accepted one wears a badge
 * instead of the action. Every OTHER person's comment (top-level or reply) offers
 * "Báo cáo" to a signed-in viewer, opening the shared {@link ReportDialog} and
 * posting `targetType: "COMMENT"` — guests and the comment's own author get none,
 * and threads outside the community module opt out via `canReportComments={false}`.
 *
 * The region is focusable (`tabIndex={-1}` + localized accessible name) so the
 * bar can move focus into it on expand.
 *
 * **Tên tác giả.** Hàng nào không mang tên thật (nguồn không join profile, hoặc node lạc
 * quan vừa gửi chưa có author card) mà LÀ CỦA NGƯỜI ĐANG ĐĂNG NHẬP thì lấy tên trong
 * store thay cho nhãn "Thành viên"; comment của người khác thì KHÔNG đoán — thiếu dữ
 * liệu là thiếu, không bịa.
 *
 * @param props - {@link PostCommentThreadProps}
 */
export const PostCommentThread = ({
    regionId,
    comments,
    isLoading,
    hasError,
    error,
    onRetry,
    labels,
    onSubmit,
    onCollapse,
    autoFocus,
    stickyComposerOnMobile,
    stickyComposer,
    currentUsername,
    currentUserId,
    onEditComment,
    onDeleteComment,
    acceptedCommentId,
    canAcceptAnswer = false,
    onAcceptAnswer,
    onReportComment,
    canReportComments = true,
    onToggleCommentLike,
    className,
}: PostCommentThreadProps) => {
    const t = useTranslations("communityHub")
    const tCommon = useTranslations("common")
    const { authenticated, requireAuth } = useRequireAuth()
    const submitReport = useMutateReportContentSwr()
    /**
     * Viewer identity for the owner gate. Surfaces that already pass
     * `currentUsername` / `currentUserId` win; the rest fall back to the session
     * user so "Báo cáo" never shows on the viewer's OWN comment (edit/delete stay
     * opt-in via their callbacks, so the fallback changes nothing for them).
     */
    const sessionUsername = useAppSelector((state) => state.user.user?.username)
    const sessionUserId = useAppSelector((state) => state.user.user?.id)
    /**
     * Tên của chính người đang đăng nhập, dùng làm nhãn cho comment CỦA HỌ khi hàng
     * không mang tên (node lạc quan vừa gửi, hoặc nguồn không join profile). Không suy
     * đoán tên cho người khác — những hàng đó vẫn là "Thành viên".
     */
    const sessionDisplayName = useAppSelector((state) => state.user.user?.displayName)
    const viewerLabel = sessionDisplayName?.trim() || sessionUsername
    const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    /**
     * Owner gate for the inline comment affordances (guest → never mine). The row
     * carries `authorUsername`, but mappers with no profile join degrade it to the
     * raw author id, so the viewer id counts as a match too (same degradation the
     * post detail's owner gate makes with `meta.authorId === currentUser.id`).
     */
    const isMine = useCallback(
        (authorUsername: string) => {
            const viewerName = currentUsername ?? sessionUsername
            const viewerId = currentUserId ?? sessionUserId
            return (
                (Boolean(viewerName) && authorUsername === viewerName) ||
                (Boolean(viewerId) && authorUsername === viewerId)
            )
        },
        [currentUsername, currentUserId, sessionUsername, sessionUserId],
    )

    /** Report ONE comment — the override when given, else the shared hook. */
    const reportComment = useCallback<ReportCommentHandler>(
        (commentId, reasonCode, detail) =>
            onReportComment
                ? onReportComment(commentId, reasonCode, detail)
                : submitReport("COMMENT", commentId, reasonCode, detail),
        [onReportComment, submitReport],
    )

    /**
     * Whether a row may offer "Báo cáo" at all: signed in, plus either the surface
     * wired its own handler or the built-in community path is valid here.
     */
    const reportEnabled = authenticated && (Boolean(onReportComment) || canReportComments)

    /**
     * Tên hiển thị của một hàng, có tính tới trường hợp hàng đó là của chính người đang
     * đăng nhập (dùng cho chip "đang trả lời" và chuỗi auto-tag).
     */
    const nameOf = useCallback(
        (comment: PostComment) =>
            resolveAuthorName(
                comment,
                (isMine(comment.authorUsername) ? viewerLabel : undefined) ??
                    tCommon("unknownMember"),
            ),
        [isMine, viewerLabel, tCommon],
    )

    /**
     * Mở ô soạn trả lời DƯỚI hàng vừa bấm. `parentId` LUÔN là comment cấp 1 (gốc): trả
     * lời một comment con vẫn gắn vào cùng gốc — cây phẳng đúng 2 cấp như Facebook — nên
     * phải tag tên người được trả lời thì người đọc mới biết câu đó nhắm vào ai.
     *
     * State là MỘT ô duy nhất, nên bấm "Trả lời" ở hàng khác tự đóng ô đang mở.
     */
    const startReply = useCallback(
        (target: PostComment, parentId: string) => {
            setReplyTo({
                target,
                parentId,
                // ponytail: chỉ tag khi trả lời comment CON; trả lời gốc thì hàng nằm ngay
                // dưới nó, tag chỉ tổ thừa.
                mention: target.id === parentId ? "" : `@${nameOf(target)} `,
            })
        },
        [nameOf],
    )

    const cancelReply = useCallback(() => {
        setReplyTo(null)
    }, [])

    /**
     * ponytail: trạng thái tym lạc quan sống NGAY TRONG thread — một map nhỏ đè lên giá trị
     * server — thay vì vá ba cache SWR khác nhau (bài cộng đồng dùng chung `["post-detail"]`,
     * thảo luận môn, thảo luận nhóm) chỉ để đổi một trái tim. Đánh đổi có chủ đích: một lần
     * refetch KHÔNG xoá override của chính người vừa bấm (vô hại — nó đúng bằng thứ họ vừa
     * làm), và lượt tym từ tab khác chỉ hiện sau khi thread remount.
     */
    const [likeOverrides, setLikeOverrides] = useState<
        Record<string, { liked: boolean; count: number }>
    >({})
    /**
     * Comment đang có request tym BAY GIỮA CHỪNG. Bấm tiếp trong lúc đó bị bỏ qua, nên
     * double-click không đẩy counter đi hai bước rồi gửi hai lệnh ngược nhau đua nhau về.
     * Dùng ref chứ không dùng state: nó là cổng chặn, không phải thứ để vẽ lại.
     */
    const pendingLikes = useRef<Set<string>>(new Set())

    /** Trạng thái tym HIỂN THỊ của một hàng: override lạc quan thắng giá trị server. */
    const likeStateOf = useCallback(
        (comment: PostComment) =>
            likeOverrides[comment.id] ?? {
                liked: comment.likedByMe ?? false,
                count: comment.likeCount ?? 0,
            },
        [likeOverrides],
    )

    /**
     * Bật/tắt tym một comment: khách chưa đăng nhập ra modal đăng nhập, người dùng thật thì
     * thấy trái tim đổi NGAY rồi mới gửi request; request hỏng thì trả lại đúng trạng thái cũ
     * kèm toast (cùng thông điệp nút tym của bài viết dùng).
     */
    const toggleLike = useCallback(
        async (comment: PostComment) => {
            if (!onToggleCommentLike || pendingLikes.current.has(comment.id)) {
                return
            }
            if (!requireAuth("auth.context.like")) {
                return
            }
            const previous = likeStateOf(comment)
            const next = {
                liked: !previous.liked,
                count: Math.max(0, previous.count + (previous.liked ? -1 : 1)),
            }
            pendingLikes.current.add(comment.id)
            setLikeOverrides((current) => ({ ...current, [comment.id]: next }))
            try {
                await onToggleCommentLike(comment.id, next.liked)
            } catch {
                setLikeOverrides((current) => ({ ...current, [comment.id]: previous }))
                toast.danger(t("engagement.likeFailed"))
            } finally {
                pendingLikes.current.delete(comment.id)
            }
        },
        [onToggleCommentLike, requireAuth, likeStateOf, t],
    )

    /** Handler truyền xuống hàng — `undefined` khi bề mặt không bật tym (khỏi render trái tim). */
    const onToggleLike = onToggleCommentLike ? (row: PostComment) => void toggleLike(row) : undefined

    /**
     * Hàng đã có id THẬT từ server chưa. Comment vừa gửi được chèn lạc quan với id tạm
     * (`tmp-<ts>` ở community, `optimistic-<ts>-<rand>` ở challenge) và mọi đường ghi tym đều
     * ép UUID (`ReactionRequest.targetId`, `@PathVariable UUID commentId`), nên tym một hàng
     * như vậy chắc chắn 400 rồi rollback + toast. Ẩn trái tim tới khi refetch trả id thật —
     * gác ở ĐÂY nên cả ba bề mặt được che cùng lúc, không phải vá từng hook lạc quan.
     */
    const isPersisted = (commentId: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(commentId)

    /** Gửi bình luận MỚI (cấp 1) — ô soạn ĐÁY, không bao giờ mang cha. */
    const handleNewComment = useCallback(
        async (body: string) => {
            if (isSubmitting) {
                return false
            }
            setIsSubmitting(true)
            const ok = await onSubmit(body)
            setIsSubmitting(false)
            return ok
        },
        [isSubmitting, onSubmit],
    )

    /** Gửi TRẢ LỜI từ ô soạn inline; gửi xong thì ô đóng lại. */
    const handleReply = useCallback(
        async (body: string) => {
            if (isSubmitting || !replyTo) {
                return false
            }
            setIsSubmitting(true)
            // Bản nháp gửi NGUYÊN VĂN: "@Tên " đã nằm sẵn trong ô soạn từ lúc bấm trả lời
            // (xem `ReplyTarget.mention`), ghép lại ở đây là tag hai lần.
            const ok = await onSubmit(body, replyTo.parentId)
            setIsSubmitting(false)
            if (ok) {
                setReplyTo(null)
            }
            return ok
        },
        [isSubmitting, onSubmit, replyTo],
    )

    /**
     * Ô soạn TRẢ LỜI hiện ngay dưới `row` khi chính hàng đó đang được trả lời — `null` với
     * mọi hàng khác, nên tại một thời điểm chỉ có đúng MỘT ô mở.
     *
     * Dùng cùng {@link RichCommentEditor} như ô soạn đáy (nên có sẵn tag @, emoji, sticker).
     * `focusTrigger` là id hàng: ô mount mới mỗi lần đổi hàng, và chính cú mount đó vừa
     * chèn "@Tên " vừa đưa con trỏ vào ô. Esc chặn lại ở đây (`stopPropagation`) để phím
     * đầu tiên đóng ô trả lời chứ không đóng luôn cả dialog đang bao quanh.
     *
     * @param row - Hàng comment đang xét.
     * @returns Ô soạn inline, hoặc `null`.
     */
    const replyComposerFor = (row: PostComment) =>
        replyTo?.target.id === row.id ? (
            <div
                role="group"
                aria-label={t("engagement.replyingTo", { name: nameOf(replyTo.target) })}
                className="ml-9 flex items-start gap-2"
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        event.stopPropagation()
                        cancelReply()
                    }
                }}
            >
                <RichCommentEditor
                    className="min-w-0 flex-1"
                    placeholder={t("engagement.replyPlaceholder")}
                    isPending={isSubmitting}
                    focusTrigger={replyTo.target.id}
                    prefill={replyTo.mention}
                    onSubmit={handleReply}
                />
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("engagement.cancelReply")}
                    onPress={cancelReply}
                >
                    <XIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            </div>
        ) : null

    return (
        <div
            id={regionId}
            role="region"
            aria-label={t("engagement.commentsRegion")}
            tabIndex={-1}
            className={cn("flex flex-col gap-3 pt-3 outline-none", className)}
        >
            {isLoading ? (
                <div className="flex flex-col gap-3">
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
            ) : hasError ? (
                <CommentLoadError error={error} onRetry={onRetry} labels={labels} />
            ) : (
                <>
                    {/* ponytail: DANH SÁCH là vùng cuộn, composer là anh em `shrink-0` NGOÀI
                        nó — nên trong một cột có chiều cao (khung đề challenge/PE, album FE)
                        ô soạn ghim đáy cột và chỉ phần bình luận trôi. Đặt trong trang cuộn
                        bình thường (feed cộng đồng, chi tiết bài, nhóm) thì cột này cao tự
                        động: `flex-1` không có khoảng trống nào để ăn và `overflow-y-auto`
                        không có gì để cắt, nên mấy chỗ đó giữ nguyên hành vi cũ. Cố tình
                        KHÔNG ép chiều cao cứng ở đây — chiều cao là việc của người gọi. */}
                    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                        {comments.length === 0 ? (
                            <Typography type="body-sm" color="muted">
                                {labels?.empty ?? t("engagement.commentsEmpty")}
                            </Typography>
                        ) : (
                            comments.map((comment) => {
                                const replies = comment.replies ?? []
                                return (
                                    <div key={comment.id} className="flex flex-col gap-3">
                                        <CommentRow
                                            comment={comment}
                                            onReply={(row) => startReply(row, comment.id)}
                                            replyLabel={t("engagement.reply")}
                                            hasThreadline={replies.length > 0}
                                            fallbackName={
                                                isMine(comment.authorUsername)
                                                    ? viewerLabel
                                                    : undefined
                                            }
                                            canManage={isMine(comment.authorUsername)}
                                            onEdit={onEditComment}
                                            onDelete={onDeleteComment}
                                            isAccepted={acceptedCommentId === comment.id}
                                            canAccept={canAcceptAnswer}
                                            onAccept={onAcceptAnswer}
                                            canReport={reportEnabled && !isMine(comment.authorUsername)}
                                            onReport={reportComment}
                                            liked={likeStateOf(comment).liked}
                                            likeCount={likeStateOf(comment).count}
                                            onToggleLike={
                                                isPersisted(comment.id) ? onToggleLike : undefined
                                            }
                                        />
                                        {replyComposerFor(comment)}
                                        {replies.map((reply, index) => {
                                            const isLast = index === replies.length - 1
                                            return (
                                                <React.Fragment key={reply.id}>
                                                    <div className="relative">
                                                        {/* trunk: continues the avatar threadline; the
                                                            last reply stops at the avatar center */}
                                                        <span
                                                            aria-hidden
                                                            className={cn(
                                                                "pointer-events-none absolute left-4 -top-3 w-0.5 -translate-x-1/2 bg-separator",
                                                                isLast ? "h-7" : "bottom-0",
                                                            )}
                                                        />
                                                        {/* elbow: connects the trunk to the reply avatar */}
                                                        <span
                                                            aria-hidden
                                                            className="pointer-events-none absolute left-4 top-4 h-0.5 w-5 bg-separator"
                                                        />
                                                        <CommentRow
                                                            comment={reply}
                                                            // Trả lời một comment con vẫn gắn vào
                                                            // GỐC (cây phẳng 2 cấp) — vì thế mới
                                                            // cần auto-tag tên người được trả lời.
                                                            onReply={(row) => startReply(row, comment.id)}
                                                            replyLabel={t("engagement.reply")}
                                                            isReply
                                                            fallbackName={
                                                                isMine(reply.authorUsername)
                                                                    ? viewerLabel
                                                                    : undefined
                                                            }
                                                            canManage={isMine(reply.authorUsername)}
                                                            onEdit={onEditComment}
                                                            onDelete={onDeleteComment}
                                                            canReport={
                                                                reportEnabled && !isMine(reply.authorUsername)
                                                            }
                                                            onReport={reportComment}
                                                            liked={likeStateOf(reply).liked}
                                                            likeCount={likeStateOf(reply).count}
                                                            onToggleLike={
                                                                isPersisted(reply.id)
                                                                    ? onToggleLike
                                                                    : undefined
                                                            }
                                                        />
                                                    </div>
                                                    {replyComposerFor(reply)}
                                                </React.Fragment>
                                            )
                                        })}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* composer — NGOÀI vùng cuộn ở trên, nên nó là mép đáy của cột */}
                    <div
                        className={cn(
                            "flex shrink-0 flex-col gap-2",
                            // `-mx-4 px-4` để dải nền phủ hết bề ngang kể cả padding của
                            // dialog — thiếu nó thì bình luận trôi lộ ra hai bên composer.
                            stickyComposer &&
                                "sticky bottom-0 z-10 -mx-4 border-t border-separator bg-surface px-4 pb-3 pt-2",
                            stickyComposerOnMobile &&
                                isFocused &&
                                "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-30 max-sm:border-t max-sm:border-separator max-sm:bg-background max-sm:p-3",
                        )}
                    >
                        {/* Ô này CHỈ viết bình luận mới — trả lời có ô riêng ngay dưới
                            hàng được trả lời (`replyComposerFor`), nên không còn chip
                            "Đang trả lời X" ở đây: chỗ ô soạn hiện ra đã nói rõ đang trả
                            lời ai, hiện thêm chip là nói hai lần. */}
                        <RichCommentEditor
                            placeholder={t("engagement.commentPlaceholder")}
                            autoFocus={autoFocus}
                            isPending={isSubmitting && !replyTo}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onSubmit={handleNewComment}
                        />
                    </div>

                    {onCollapse ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 self-start px-0 text-xs"
                            onPress={onCollapse}
                        >
                            <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                            {t("engagement.collapse")}
                        </Button>
                    ) : null}
                </>
            )}
        </div>
    )
}
