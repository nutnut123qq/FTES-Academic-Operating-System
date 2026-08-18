"use client"

import React, { useEffect, useState } from "react"
import { Button, Chip, Modal, Typography } from "@heroui/react"
import {
    ArrowSquareOutIcon,
    CaretRightIcon,
    ChatCircleIcon,
    FileTextIcon,
    GraduationCapIcon,
    HeartIcon,
    PushPinIcon,
    SignOutIcon,
    TargetIcon,
    UsersIcon,
    XIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import { Link, useRouter } from "@/i18n/navigation"
import { UserLink } from "@/components/features/identity"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    useQuerySubjectOverviewSwr,
    type OverviewPost,
    type SubjectOverview as SubjectOverviewModel,
} from "../hooks/useQuerySubjectOverviewSwr"
import {
    useQuerySubjectCodingChallengesSwr,
    type ChallengeLifecycle,
    type CodingChallenge,
} from "../hooks/useQuerySubjectCodingChallengesSwr"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"
import { useMutateSubjectMembershipSwr } from "../hooks/useMutateSubjectMembershipSwr"
import { useQuerySubjectFeedSwr } from "../hooks/useQuerySubjectFeedSwr"
import { getCourseIdentity } from "./course-identity"

/** How many recent discussions to surface on the overview. */
const RECENT_DISCUSSIONS = 5

/** A linked course resolved for the "Khóa học của môn này" link-out card. */
interface LinkedCourse {
    /** Course id — the `/courses/[courseId]` segment. */
    id: string
    /** Course code (e.g. `PRF192`) when the curated title carries one. */
    code: string | null
    /** Human course name. */
    name: string
}

/** lifecycle → chip color. */
const LIFECYCLE_COLOR: Record<ChallengeLifecycle, "success" | "warning" | "default"> = {
    running: "success",
    upcoming: "warning",
    closed: "default",
}

/**
 * The challenge solver, loaded only once a reader actually opens one.
 *
 * A STATIC import would pull the whole solver — markdown renderer, code grader, the UI/UX
 * editor — into the subject landing page, which is the most-walked page of the workspace
 * and where most readers never open a challenge at all. `ssr: false` because the dialog
 * only ever exists after a click, so there is no server pass to render it in.
 */
const ChallengeView = dynamic(
    () =>
        import("@/components/features/challenge/ChallengeView").then(
            (mod) => mod.ChallengeView,
        ),
    { ssr: false },
)

/** How many newest challenges to surface on the overview rail. */
const OVERVIEW_CHALLENGES = 5

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
    const recentPosts: Array<OverviewPost> = subjectPosts.slice(0, RECENT_DISCUSSIONS).map((post) => ({
        id: post.id,
        author: post.author,
        authorUsername: post.authorUsername,
        timeLabel: post.timeLabel,
        title: post.title,
        snippet: post.snippet,
        reactions: post.reactions,
        comments: post.comments,
    }))

    const base = `/subjects/${subjectId}`
    // linked-course mapping — REAL workspace `learning` links (targetType = COURSE);
    // link-out only (the Course module owns course data).
    const linkedCourses: Array<LinkedCourse> = (subject?.courseLinks ?? []).map(
        (link) => ({ id: link.id, ...getCourseIdentity(link) }),
    )
    // "Challenges của môn" rail — the REAL bank the Practice/Coding module lists,
    // newest first (sorted by startsAt desc; the BE list carries no createdAt). Each
    // row links to the full solver page (`/challenges/{id}`) = the course-side IDE.
    //
    // Rail có BA trạng thái, không phải hai — nên lấy CẢ `isLoading` lẫn `error`:
    //   - đang tải: chưa biết gì → KHÔNG được nói câu nào về số bài của môn;
    //   - lỗi: hook NÉM khi không đọc được môn thay vì lặng lẽ trả kho toàn cục, nên
    //     "rỗng vì lỗi" phải phân biệt với "môn chưa có bài". Rail không có chỗ cho nút
    //     thử lại — link "Xem tất cả" dẫn sang tab Luyện tập, nơi CÓ lỗi + retry thật;
    //   - rỗng thật: chỉ lúc này mới được nói "môn này chưa có challenge nào".
    //
    // VÌ SAO nhánh đang-tải là BẮT BUỘC chứ không phải phòng xa: SwrProvider đặt
    // `keepPreviousData: false` và không bật suspense, nên trước khi fetch xong
    // `data === undefined` → `challenges = []` VÀ `error = undefined`. Cổng loading của cả
    // trang (AsyncContent bên dưới) lại đo bằng hook KHÁC (`getSubjectWorkspace`, MỘT
    // request), còn hook này phải chạy HAI request TUẦN TỰ (`getSubjectDetail` →
    // `listChallenges`) nên luôn xong sau. Thiếu nhánh này thì mỗi lần mở trang môn,
    // skeleton trang vừa tắt là rail khẳng định "chưa có challenge nào" rồi mới nhảy sang
    // danh sách — sai chắc chắn, không phải hên xui. Đổi môn cũng lặp lại y hệt vì
    // keepPreviousData=false xoá data theo key.
    const {
        challenges: subjectChallenges,
        isLoading: challengesLoading,
        error: challengesError,
    } = useQuerySubjectCodingChallengesSwr(subjectId)
    const newestChallenges = [...subjectChallenges]
        .sort((a, b) => Date.parse(b.startsAt ?? "") - Date.parse(a.startsAt ?? ""))
        .slice(0, OVERVIEW_CHALLENGES)

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
                        linkedCourses={linkedCourses}
                        newestChallenges={newestChallenges}
                        challengesLoading={challengesLoading}
                        challengesFailed={Boolean(challengesError)}
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
    linkedCourses,
    newestChallenges,
    challengesLoading,
    challengesFailed,
    onCompose,
    base,
    subjectId,
    subjectName,
    isMember,
    isMembershipLoading,
    onJoin,
    isJoining,
    onLeave,
    isLeaving,
}: {
    overview: SubjectOverviewModel
    recentPosts: Array<OverviewPost>
    linkedCourses: Array<LinkedCourse>
    /** Newest challenges of the subject, for the "Challenges của môn" rail. */
    newestChallenges: Array<CodingChallenge>
    /**
     * Kho challenge của môn ĐANG ĐỌC (chưa có câu trả lời nào). Rail phải hiện skeleton
     * chứ tuyệt đối không được khẳng định "chưa có challenge nào": lúc này danh sách rỗng
     * chỉ vì chưa fetch xong, chưa phải vì môn trống.
     */
    challengesLoading: boolean
    /**
     * Đọc kho challenge của môn THẤT BẠI (khác với môn chưa có bài nào). Rail phải im
     * lặng trong ca này thay vì khẳng định "chưa có challenge nào" — một câu sai.
     */
    challengesFailed: boolean
    onCompose: () => void
    base: string
    /**
     * The subject code (`CSD201`) — handed to {@link ChallengeView} when a challenge opens
     * in the dialog, the same value `?subject=` carries on the route.
     */
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
}) => {
    const t = useTranslations("subjects")
    const router = useRouter()

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
    // The challenge being read in the dialog — `null` = closed. This rail is the entry the
    // reader actually uses for a PE paper, so the popup lives here rather than in ExamList
    // (which only ever lists FE albums).
    const [openedChallengeId, setOpenedChallengeId] = useState<string | null>(null)

    return (
        <div className="flex flex-col gap-6">
            {/* stats line + the member-only "rời môn" action */}
            <div className="flex items-center gap-3">
                <Typography type="body-sm" color="muted" className="min-w-0 flex-1">
                    {t("overview.statsLine", {
                        members: overview.stats.members,
                        moderators: overview.stats.moderators,
                        resources: overview.stats.resources,
                    })}
                </Typography>
                {isMember ? (
                    <Button
                        size="sm"
                        variant="tertiary"
                        className="shrink-0"
                        isDisabled={isLeaving}
                        isPending={isLeaving}
                        onPress={() => setLeaveOpen(true)}
                    >
                        <SignOutIcon aria-hidden focusable="false" className="size-4" />
                        {t("membership.leave")}
                    </Button>
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

            {/* A challenge read in place. Same shape as the FE album's dialog in ExamList
                and as CommunityFeed's post: the body is the SAME component the route
                renders, so the popup and `/challenges/{id}` cannot drift apart. The dialog
                owns the scroll — inside it `ChallengeView` creates no scroll region of its
                own, so a tall paper (attachment + hand-in panel + thread) would otherwise
                be cut. */}
            <Modal
                isOpen={openedChallengeId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setOpenedChallengeId(null)
                    }
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container className="p-3 sm:p-6">
                        <Modal.Dialog className="max-h-[90vh] w-[95vw] max-w-6xl overflow-y-auto">
                            <Modal.CloseTrigger
                                aria-label={t("practice.exam.closeExam")}
                                className="z-20"
                            />
                            {openedChallengeId !== null ? (
                                <>
                                    <div className="flex justify-end pe-10">
                                        <Button
                                            size="sm"
                                            variant="tertiary"
                                            onPress={() =>
                                                router.push(
                                                    `/challenges/${openedChallengeId}?subject=${encodeURIComponent(subjectId)}`,
                                                )
                                            }
                                        >
                                            <ArrowSquareOutIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-4"
                                            />
                                            {t("practice.exam.openFullPage")}
                                        </Button>
                                    </div>
                                    <ChallengeView
                                        challengeId={openedChallengeId}
                                        subjectCode={subjectId}
                                        inModal
                                    />
                                </>
                            ) : null}
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* feed */}
                <div className="flex flex-col gap-6 md:col-span-2">
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
                            <Button size="sm" variant="primary" className="shrink-0" onPress={onCompose}>
                                {t("overview.compose")}
                            </Button>
                        </div>
                        {recentPosts.length > 0 ? (
                            recentPosts.map((post, index) => (
                                <PostRow
                                    key={post.id}
                                    post={post}
                                    withDivider={index > 0}
                                    discussionHref={`${base}/discussion`}
                                />
                            ))
                        ) : (
                            <Typography type="body-sm" color="muted">
                                {t("overview.noDiscussions")}
                            </Typography>
                        )}
                    </div>
                </div>

                {/* shortcut rails */}
                <div className="flex flex-col gap-6">
                    <LinkedCoursesCard courses={linkedCourses} />

                    <RailCard title={t("overview.newResources")} href={`${base}/resources`} seeAll={t("overview.seeAll")}>
                        {overview.newResources.map((resource) => (
                            <div key={resource.id} className="flex items-center gap-2">
                                <FileTextIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                                <Typography type="body-sm" color="muted" className="min-w-0 flex-1" truncate>
                                    {resource.title}
                                </Typography>
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`resources.types.${resource.type}`)}
                                </Chip>
                            </div>
                        ))}
                    </RailCard>

                    {/* Rail này ăn CHUNG hook với tab Luyện tập nhưng trước đây bỏ qua cờ
                        `scoped`, nên nó lặng lẽ chiếu đề của môn khác mà không một dòng
                        cảnh báo nào — tệ hơn cả tab Luyện tập (ở đó ít ra còn có banner).
                        Bỏ fallback trong hook là rail tự đúng; đổi lại nó nay rỗng thật
                        được, nên phải có câu cho trạng thái rỗng của chính nó.

                        Thứ tự nhánh BẮT BUỘC là tải → có dòng → lỗi → rỗng, cùng cách gác
                        như bề mặt anh em CodingChallengeList (`isLoading && length === 0`
                        → skeleton). Đảo thứ tự (hỏi "rỗng?" trước) là quay lại đúng lỗi cũ:
                        nói "chưa có challenge nào" trong lúc còn chưa đọc xong. */}
                    <RailCard title={t("overview.challenges")} href={`${base}/practice`} seeAll={t("overview.seeAll")}>
                        {challengesLoading && newestChallenges.length === 0 ? (
                            <ChallengeRailSkeleton />
                        ) : newestChallenges.length > 0 ? (
                            newestChallenges.map((challenge) => (
                                // Opens ON THE SPOT rather than navigating — this rail is
                                // where a PE paper is actually reached, so it is the rail
                                // that owns the dialog. The URL does not change; the row's
                                // page still exists at `/challenges/{id}` and the dialog
                                // offers it explicitly.
                                <button
                                    key={challenge.id}
                                    type="button"
                                    onClick={() => setOpenedChallengeId(challenge.id)}
                                    className="group flex w-full items-center gap-2 text-start"
                                >
                                    <TargetIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                                    <Typography type="body-sm" color="muted" className="min-w-0 flex-1 group-hover:underline" truncate>
                                        {challenge.title}
                                    </Typography>
                                    <Chip size="sm" variant="soft" color={LIFECYCLE_COLOR[challenge.lifecycle]}>
                                        {t(`practice.coding.lifecycle.${challenge.lifecycle}`)}
                                    </Chip>
                                </button>
                            ))
                        ) : challengesFailed ? null : (
                            <Typography type="body-sm" color="muted">
                                {t("overview.noChallenges")}
                            </Typography>
                        )}
                    </RailCard>

                    <RailCard title={t("overview.activeMembers")} href={`${base}/members`} seeAll={t("overview.seeAll")}>
                        <div className="flex items-center">
                            {overview.activeMembers.map((member, index) => (
                                <UserLink
                                    key={member.id}
                                    username={member.username}
                                    displayName={member.name}
                                    hideName
                                    size="sm"
                                    className={index > 0 ? "-ml-2" : undefined}
                                    classNames={{ avatar: "size-8 ring-2 ring-background" }}
                                />
                            ))}
                            {overview.activeOverflow > 0 ? (
                                <div className="-ml-2 flex size-8 items-center justify-center rounded-full bg-default/40 text-xs text-muted ring-2 ring-background">
                                    +{overview.activeOverflow}
                                </div>
                            ) : null}
                        </div>
                    </RailCard>
                </div>
            </div>
        </div>
    )
}

/** A single discussion row: initials avatar + author/time + title + snippet + reactions. */
const PostRow = ({
    post,
    withDivider,
    discussionHref,
}: {
    post: OverviewPost
    withDivider: boolean
    /** Where the like / comment affordances lead — the full discussion tab, which
     *  owns the real react + comment interactions (checklist STT 21). */
    discussionHref: string
}) => {
    const t = useTranslations("subjects")
    return (
        <div className={withDivider ? "flex gap-3 border-t border-separator pt-3" : "flex gap-3"}>
            <UserLink
                username={post.authorUsername}
                displayName={post.author}
                hideName
                size="sm"
                classNames={{ avatar: "size-8" }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0">
                <div className="flex items-center gap-2">
                    <UserLink username={post.authorUsername} displayName={post.author} showAvatar={false} />
                    <Typography type="body-xs" color="muted">
                        {post.timeLabel}
                    </Typography>
                </div>
                <Typography type="body-sm" weight="medium">
                    {post.title}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {post.snippet}
                </Typography>
                <div className="mt-2 flex items-center gap-3 text-muted">
                    <Link
                        href={discussionHref}
                        className="flex items-center gap-2 text-muted no-underline transition-colors hover:text-danger"
                        aria-label={t("overview.reactionsAria", { count: post.reactions })}
                    >
                        <HeartIcon aria-hidden focusable="false" className="size-4" />
                        <Typography type="body-xs" color="muted">{post.reactions}</Typography>
                    </Link>
                    <Link
                        href={discussionHref}
                        className="flex items-center gap-2 text-muted no-underline transition-colors hover:text-accent"
                        aria-label={t("overview.commentsAria", { count: post.comments })}
                    >
                        <ChatCircleIcon aria-hidden focusable="false" className="size-4" />
                        <Typography type="body-xs" color="muted">{post.comments}</Typography>
                    </Link>
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
 * "Khóa học của môn này" — the course link-out card (workspace IA domain
 * separation: structured learning lives in the Course module; the workspace only
 * links out). Lists each linked course's identity + a "Xem khóa học" CTA to
 * `/courses/[courseId]`; renders nothing when the subject has no linked course.
 * No course content (sections/lessons/video/quiz/progress) is embedded.
 */
const LinkedCoursesCard = ({ courses }: { courses: Array<LinkedCourse> }) => {
    const t = useTranslations("subjects")

    if (courses.length === 0) return null

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <Typography type="body-sm" weight="medium">
                {t("overview.linkedCourses")}
            </Typography>
            {courses.map((course) => (
                <div key={course.id} className="flex items-center gap-2">
                    <GraduationCapIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                        <Typography type="body-sm" weight="medium" truncate>
                            {course.code ?? course.name}
                        </Typography>
                        {course.code ? (
                            <Typography type="body-xs" color="muted" truncate>
                                {course.name}
                            </Typography>
                        ) : null}
                    </div>
                    <Link
                        href={`/courses/${course.id}`}
                        aria-label={
                            course.code
                                ? t("overview.viewCourseAria", { code: course.code, name: course.name })
                                : t("overview.viewCourseNameAria", { name: course.name })
                        }
                        className="flex shrink-0 items-center gap-2 text-sm text-accent hover:underline"
                    >
                        {t("overview.viewCourse")}
                        <CaretRightIcon aria-hidden focusable="false" className="size-4" />
                    </Link>
                </div>
            ))}
        </div>
    )
}

/**
 * Trạng thái ĐANG TẢI của rail "Challenges của môn" — ba dòng shimmer cỡ đúng một dòng
 * challenge (icon + tên + chip lifecycle), để rail không nhảy cao khi dữ liệu về.
 *
 * Đây là câu trả lời trung thực duy nhất khi chưa đọc xong: rail không biết môn có bao
 * nhiêu bài, nên nó không nói gì về số lượng — khác hẳn "Môn này chưa có challenge nào",
 * vốn là một lời KHẲNG ĐỊNH và sẽ sai suốt quãng thời gian fetch.
 */
const ChallengeRailSkeleton = () => (
    <div className="flex flex-col gap-3" aria-hidden>
        <Skeleton className="h-5 w-full rounded-sm" />
        <Skeleton className="h-5 w-full rounded-sm" />
        <Skeleton className="h-5 w-2/3 rounded-sm" />
    </div>
)

/** A right-rail shortcut card: a title + "see all" link over a small list. */
const RailCard = ({
    title,
    href,
    seeAll,
    children,
}: {
    title: string
    href: string
    seeAll: string
    children: React.ReactNode
}) => (
    <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
        <div className="flex items-center gap-2">
            <Typography type="body-sm" weight="medium" className="min-w-0 flex-1">
                {title}
            </Typography>
            <Link href={href} className="flex items-center gap-0.5 text-sm text-accent no-underline">
                {seeAll}
                <CaretRightIcon aria-hidden focusable="false" className="size-4" />
            </Link>
        </div>
        {children}
    </div>
)

/** Loading skeleton — mirrors the banner + two-column hub: pinned card + heading + post rows on the left, the course link-out card slot + 3 rail cards on the right. */
const OverviewSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-large" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-6 md:col-span-2">
                <Skeleton className="h-24 w-full rounded-large" />
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-5 w-40 rounded-sm" />
                    <Skeleton className="h-16 w-full rounded-large" />
                    <Skeleton className="h-16 w-full rounded-large" />
                    <Skeleton className="h-16 w-full rounded-large" />
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <Skeleton className="h-24 w-full rounded-large" />
                <Skeleton className="h-28 w-full rounded-large" />
                <Skeleton className="h-28 w-full rounded-large" />
                <Skeleton className="h-24 w-full rounded-large" />
            </div>
        </div>
    </div>
)
