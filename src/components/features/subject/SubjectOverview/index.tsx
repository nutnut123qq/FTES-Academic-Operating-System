"use client"

import React, { useEffect, useState } from "react"
import { Button, Dropdown, Label, Modal, Typography } from "@heroui/react"
import {
    DotsThreeIcon,
    PushPinIcon,
    SignOutIcon,
    UserIcon,
    UsersIcon,
    XIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { CommunityFeedRow } from "@/components/features/community/CommunityFeed"
import { DISCUSSION_ENGAGEMENT_ACTIONS } from "@/components/reuseable/PostEngagementBar"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useAppSelector } from "@/redux/hooks"
import {
    useQuerySubjectOverviewSwr,
    type SubjectOverview as SubjectOverviewModel,
} from "../hooks/useQuerySubjectOverviewSwr"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"
import { useMutateSubjectMembershipSwr } from "../hooks/useMutateSubjectMembershipSwr"
import { useQuerySubjectFeedSwr } from "../hooks/useQuerySubjectFeedSwr"
import type { CommunityPost } from "@/components/features/community/hooks/useQueryCommunityFeedSwr"

/** How many recent discussions to surface on the overview. */
const RECENT_DISCUSSIONS = 5

/**
 * Subject-workspace Overview tab (§ subject hub) — direction A (chosen 2026-07-02):
 * a community hub, NOT a course sales page. A "you've joined" banner, then a two-
 * column layout: the discussion feed (pinned moderator post + recent posts) on the
 * left, and shortcut rails (new resources, highlighted challenges, active members)
 * on the right. The subject is a space you join like a community.
 *
 * Renders inside the existing `SubjectWorkspaceShell` (sidebar + identity header).
 * Feature owns data + routing + i18n. ponytail: "Đăng bài" + shortcut rows are
 * navigation/no-ops; feed rows are hand-rolled to match the sibling SubjectCommunity
 * idiom. Mock via `useQuerySubjectOverviewSwr`.
 */
export const SubjectOverview = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const router = useRouter()
    const { overview, error, mutate } = useQuerySubjectOverviewSwr(subjectId)
    const {
        subject,
        error: subjectError,
        isMembershipLoading,
    } = useQuerySubjectSwr(subjectId)
    const { join, leave, isJoining, isLeaving } =
        useMutateSubjectMembershipSwr(subjectId)
    // "Recent discussions" are the REAL subject community feed (the workspace REST aggregate carries no
    // posts — the overview hook returns []). Fetch the newest (FOR_YOU) via the same GraphQL the Discussion
    // tab uses; needs the subject UUID (route param is the code), gated until `subject` resolves.
    const { posts: subjectPosts } = useQuerySubjectFeedSwr(subject?.uuid ?? "", "forYou")
    // "Bài của tôi" (menu ⋯) — bộ lọc CHỈ SỐNG Ở FE. Feed môn của BE
    // (`subjectWorkspace.community(scope:)`) không nhận tham số tác giả nào, nên so `authorId`
    // của từng bài với người đang đọc là cách duy nhất không phải bịa endpoint.
    //
    // Lọc BẮT BUỘC nằm ở đây, TRƯỚC lát cắt `RECENT_DISCUSSIONS`: cắt 5 bài rồi mới lọc thì
    // "bài của tôi" chỉ soi được 5 bài mới nhất của cả môn và gần như luôn rỗng.
    //
    // ponytail: trần của bộ lọc là 20 bài gần nhất — resolver `SubjectWorkspace.community`
    // chốt cứng `limit = 20` và feed môn không phân trang (xem docblock `useQuerySubjectFeedSwr`),
    // nên bài của tôi nằm ngoài cửa sổ đó thì danh sách rỗng. Đó là CỬA SỔ, không phải trang 2 hỏng.
    const [feedFilter, setFeedFilter] = useState<"mine" | null>(null)
    const viewerId = useAppSelector((state) => state.user.user)?.id ?? null
    // Chưa biết mình là ai (viewer chưa hydrate) thì lọc ra RỖNG, không rơi về "hiện tất cả":
    // nhãn ghi "Bài của tôi" mà liệt bài người khác là nói dối, còn rỗng thì chỉ là chưa biết.
    const filteredPosts =
        feedFilter === "mine"
            ? subjectPosts.filter((post) => viewerId !== null && post.authorId === viewerId)
            : subjectPosts
    // Card dùng chung `CommunityFeedRow` nhận thẳng `CommunityPost` — đúng thứ hook trả về,
    // nên ở đây chỉ còn CẮT, không còn lớp map sang hình dạng riêng của trang.
    const recentPosts = filteredPosts.slice(0, RECENT_DISCUSSIONS)

    const base = `/subjects/${subjectId}`

    return (
        <div className="p-6">
            <AsyncContent
                isLoading={(!overview && !error) || (!subject && !subjectError)}
                skeleton={<OverviewSkeleton />}
                error={!overview ? error : undefined}
                errorContent={{
                    title: t("overview.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("overview.retry"),
                }}
            >
                {overview ? (
                    <OverviewView
                        overview={overview}
                        recentPosts={recentPosts}
                        onCompose={() => router.push(`${base}/discussion`)}
                        base={base}
                        subjectId={subjectId}
                        subjectName={subject?.name ?? subjectId}
                        isMember={subject?.isMember ?? false}
                        isMembershipLoading={isMembershipLoading}
                        onJoin={() => { void join() }}
                        isJoining={isJoining}
                        onLeave={() => { void leave() }}
                        isLeaving={isLeaving}
                        feedFilter={feedFilter}
                        onFeedFilter={setFeedFilter}
                    />
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** Presentation of the loaded overview. */
const OverviewView = ({
    overview,
    recentPosts,
    onCompose,
    base,
    subjectName,
    isMember,
    isMembershipLoading,
    onJoin,
    isJoining,
    onLeave,
    isLeaving,
    feedFilter,
    onFeedFilter,
}: {
    overview: SubjectOverviewModel
    recentPosts: Array<CommunityPost>
    onCompose: () => void
    base: string
    /** The subject code (`CSD201`) — the value `?subject=` carries on the route. */
    subjectId: string
    /** Subject name, shown in the leave confirmation. */
    subjectName: string
    /** Real membership (workspace `callerMembership`), NOT a hardcoded flag. */
    isMember: boolean
    /** Membership read still in flight — neither banner nor CTA is honest yet. */
    isMembershipLoading: boolean
    onJoin: () => void
    isJoining: boolean
    onLeave: () => void
    isLeaving: boolean
    /**
     * Bộ lọc feed đang bật: `"mine"` = chỉ bài của chính người đọc, `null` = toàn bộ. Trạng
     * thái nằm ở component CHA vì lát cắt `RECENT_DISCUSSIONS` cũng nằm ở đó — lọc sau khi
     * cắt thì bộ lọc chỉ soi được 5 bài.
     */
    feedFilter: "mine" | null
    onFeedFilter: (filter: "mine" | null) => void
}) => {
    const t = useTranslations("subjects")

    // "Đã tham gia" giờ chỉ là 1 thông báo tắt được (STT 29C) — nhớ trạng thái tắt
    // theo từng workspace qua localStorage (key = base, duy nhất theo subjectId).
    const dismissKey = `ftes:subject-joined-dismissed:${base}`
    const [joinedDismissed, setJoinedDismissed] = useState(false)
    useEffect(() => {
        setJoinedDismissed(localStorage.getItem(dismissKey) === "1")
    }, [dismissKey])
    const dismissJoined = () => {
        localStorage.setItem(dismissKey, "1")
        setJoinedDismissed(true)
    }
    const [leaveOpen, setLeaveOpen] = useState(false)

    return (
        <div className="flex flex-col gap-6">
            <LeaveConfirmModal
                isOpen={leaveOpen}
                subjectName={subjectName}
                isLeaving={isLeaving}
                onClose={() => setLeaveOpen(false)}
                onConfirm={() => {
                    setLeaveOpen(false)
                    onLeave()
                }}
            />


            {/* MỘT cột trải hết bề ngang. Lưới 2 cột cũ ở đây đã hết lý do tồn tại từ khi
                rail lối tắt dời sang `SubjectWorkspaceShell` làm sidebar phải của cả
                workspace: cột 16rem thứ hai không còn ai ở, nhưng grid vẫn giữ chỗ cho nó nên
                nội dung bị ép vào 1fr và chừa một mảng trống bên phải. */}
            <div className="flex flex-col gap-6">
                {/* stats line + the member-only "⋯" menu (my content · pin · leave) */}
                <div className="flex items-center gap-3">
                    <Typography type="body-sm" color="muted" className="min-w-0 flex-1">
                        {t("overview.statsLine", {
                            members: overview.stats.members,
                            moderators: overview.stats.moderators,
                            resources: overview.stats.resources,
                        })}
                    </Typography>
                    {isMember ? (
                        // Cùng khung ⋯ với MemberActionsMenu của tab Thành viên (Dropdown + Button
                        // isIconOnly ghost + DotsThreeIcon), không dựng menu riêng.
                        <Dropdown>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                className="shrink-0"
                                aria-label={t("overview.actions")}
                                isDisabled={isLeaving}
                            >
                                <DotsThreeIcon aria-hidden focusable="false" className="size-5" weight="bold" />
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu aria-label={t("overview.actions")}>
                                    <Dropdown.Section>
                                        {/* react-aria cần `id` thật, không lấy được từ React key */}
                                        <Dropdown.Item
                                            id="my-content"
                                            textValue={t("overview.myContent")}
                                            onPress={() =>
                                                onFeedFilter(feedFilter === "mine" ? null : "mine")
                                            }
                                        >
                                            <UserIcon aria-hidden focusable="false" className="size-5" />
                                            <Label>{t("overview.myContent")}</Label>
                                        </Dropdown.Item>

                                        {/* GHIM BÀI THẢO LUẬN — VÔ HIỆU HOÁ, chặn ở BE, không phải ở đây.
                                            Cờ `Post.pinned` có thật và feed môn đã trả về, nhưng:
                                              1. đường ghim duy nhất là POST /api/v1/admin/community/posts/{id}/pin,
                                                 gác `access.require("admin.community.moderate")` — quyền admin
                                                 NỀN TẢNG, không phải moderator của môn, nên thành viên bấm sẽ 403;
                                              2. và kể cả ghim được thì bài VẪN không lên đầu: `subjectFeed` gọi thẳng
                                                 `findSubjectFeedCursor`, câu JPQL sắp `ORDER BY p.createdAt DESC, p.id DESC`
                                                 và không đi qua `mergePinned` như feed công khai.
                                            Nút "chạy" mà không có tác dụng nhìn thấy được là kiểu hỏng tệ nhất, nên
                                            mục này hiện ra kèm lý do thay vì giả vờ hoạt động. Mở khoá = việc BE. */}
                                        <Dropdown.Item
                                            id="pin-post"
                                            isDisabled
                                            textValue={t("overview.pinPost")}
                                        >
                                            <PushPinIcon aria-hidden focusable="false" className="size-5" />
                                            <div className="flex min-w-0 flex-col">
                                                <Label>{t("overview.pinPost")}</Label>
                                                <Typography type="body-xs" color="muted">
                                                    {t("overview.pinPostUnavailable")}
                                                </Typography>
                                            </div>
                                        </Dropdown.Item>
                                    </Dropdown.Section>
                                    <Dropdown.Section>
                                        {/* rời môn vẫn đi qua ĐÚNG modal xác nhận cũ */}
                                        <Dropdown.Item
                                            id="leave"
                                            textValue={t("membership.leave")}
                                            onPress={() => setLeaveOpen(true)}
                                        >
                                            <SignOutIcon aria-hidden focusable="false" className="size-5" />
                                            <Label>{t("membership.leave")}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Section>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    ) : null}
                </div>

                {/* membership state: the "đã tham gia" notice is ONLY for real members
                    (workspace `callerMembership` != null); a non-member gets the join CTA. */}
                {isMembershipLoading ? null : isMember ? (
                    !joinedDismissed ? (
                        <div className="flex items-center gap-3 rounded-2xl bg-accent/10 p-4">
                            <UsersIcon aria-hidden focusable="false" className="size-6 shrink-0 text-accent" />
                            <Typography type="body-sm" weight="medium" className="min-w-0 flex-1 text-accent">
                                {t("overview.joined")}
                            </Typography>
                            <Button
                                isIconOnly
                                variant="tertiary"
                                size="sm"
                                className="shrink-0"
                                aria-label={t("overview.dismiss")}
                                onPress={dismissJoined}
                            >
                                <XIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                        </div>
                    ) : null
                ) : (
                    <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <UsersIcon aria-hidden focusable="false" className="size-6 shrink-0 text-accent" />
                            <Typography type="body-sm" color="muted" className="min-w-0 flex-1">
                                {t("membership.joinHint")}
                            </Typography>
                        </div>
                        <Button
                            variant="primary"
                            className="shrink-0 self-start sm:self-auto"
                            isDisabled={isJoining}
                            isPending={isJoining}
                            onPress={onJoin}
                        >
                            {t("membership.join")}
                        </Button>
                    </div>
                )}

                {overview.pinnedPost ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-accent/40 bg-accent/5 p-4">
                        <div className="flex items-center gap-2 text-accent">
                            <PushPinIcon aria-hidden focusable="false" className="size-4" />
                            <Typography type="body-xs" weight="medium" className="text-accent">
                                {t("overview.pinned")}
                            </Typography>
                        </div>
                        <Typography type="body" weight="medium">
                            {overview.pinnedPost.title}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {overview.pinnedPost.snippet}
                        </Typography>
                    </div>
                ) : null}

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Typography type="h6" weight="bold" className="min-w-0 flex-1">
                            {t("overview.discussions")}
                        </Typography>
                        {/* Bộ lọc đang bật phải NHÌN THẤY được và gỡ được ngay tại đây — nếu
                            không, feed tự dưng ngắn lại mà không ai giải thích vì sao. */}
                        {feedFilter === "mine" ? (
                            <Button
                                size="sm"
                                variant="tertiary"
                                className="shrink-0"
                                aria-label={t("overview.myContentClear")}
                                onPress={() => onFeedFilter(null)}
                            >
                                {t("overview.myContent")}
                                <XIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                        ) : null}
                        <Button size="sm" variant="primary" className="shrink-0" onPress={onCompose}>
                            {t("overview.compose")}
                        </Button>
                    </div>
                    {recentPosts.length > 0 ? (
                        // Card RỜI dùng chung với /community và tab Thảo luận (popup, tym,
                        // bình luận, menu ⋯ đều đi kèm) thay cho hàng phẳng ngăn bằng divider:
                        // một bài trong môn LÀ một bài cộng đồng, hai bề mặt vẽ khác nhau là
                        // hai bản phải cùng sửa mỗi lần card đổi.
                        <div className="flex flex-col gap-3">
                            {recentPosts.map((post) => (
                                <CommunityFeedRow
                                    key={post.id}
                                    post={post}
                                    actions={DISCUSSION_ENGAGEMENT_ACTIONS}
                                />
                            ))}
                        </div>
                    ) : (
                        <Typography type="body-sm" color="muted">
                            {/* rỗng vì LỌC khác rỗng vì môn chưa ai đăng — đừng nói nhầm câu */}
                            {feedFilter === "mine"
                                ? t("overview.noMyPosts")
                                : t("overview.noDiscussions")}
                        </Typography>
                    )}
                </div>
            </div>
        </div>
    )
}

/**
 * Confirmation before leaving the workspace — leaving drops the AI tools + member-only
 * surfaces, so it is never a one-tap action.
 */
const LeaveConfirmModal = ({
    isOpen,
    subjectName,
    isLeaving,
    onClose,
    onConfirm,
}: {
    isOpen: boolean
    subjectName: string
    isLeaving: boolean
    onClose: () => void
    onConfirm: () => void
}) => {
    const t = useTranslations("subjects")
    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {t("membership.leaveConfirmTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body>
                            <Typography type="body-sm" color="muted">
                                {t("membership.leaveConfirmBody", { name: subjectName })}
                            </Typography>
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button variant="tertiary" onPress={onClose}>
                                {t("membership.leaveCancel")}
                            </Button>
                            <Button
                                variant="danger"
                                isDisabled={isLeaving}
                                isPending={isLeaving}
                                onPress={onConfirm}
                            >
                                {t("membership.leaveConfirm")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}


/**
 * Loading skeleton — soi gương đúng bố cục thật. MỘT cột kể từ khi rail lối tắt rời sang
 * `SubjectWorkspaceShell` (nó là sidebar của cả workspace, không còn là nửa phải của
 * trang này): shimmer hai cột rồi trang trả về một là tự tạo cú giật.
 */
const OverviewSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-large" />
        <Skeleton className="h-24 w-full rounded-large" />
        <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40 rounded-sm" />
            <Skeleton className="h-16 w-full rounded-large" />
            <Skeleton className="h-16 w-full rounded-large" />
            <Skeleton className="h-16 w-full rounded-large" />
        </div>
    </div>
)
