"use client"

import React, { useState } from "react"
import { Button, Chip, Modal, Typography, cn } from "@heroui/react"
import {
    ArrowSquareOutIcon,
    CaretRightIcon,
    FileTextIcon,
    GraduationCapIcon,
    TargetIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import { Link, useRouter } from "@/i18n/navigation"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQuerySubjectOverviewSwr } from "../hooks/useQuerySubjectOverviewSwr"
import {
    useQuerySubjectCodingChallengesSwr,
    type ChallengeLifecycle,
} from "../hooks/useQuerySubjectCodingChallengesSwr"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"
import { getCourseIdentity } from "../SubjectOverview/course-identity"
import { useSidebarCollapsed } from "@/components/blocks/navigation/CollapsibleSidebar/context"

/** lifecycle → status-dot fill (rail rows are too narrow for a text chip). */
const LIFECYCLE_DOT: Record<ChallengeLifecycle, string> = {
    running: "bg-success",
    upcoming: "bg-warning",
    closed: "bg-muted",
}

/** How many newest challenges to surface on the rail. */
const RAIL_CHALLENGES = 5

/**
 * What the rail becomes once it is collapsed: the same destinations as the
 * expanded cards, as icon links. A collapsed rail is ~4rem wide — enough for an icon
 * and nothing else — so it stops being a preview of content and becomes pure nav.
 */
const COLLAPSED_SHORTCUTS = [
    { segment: "resources", labelKey: "overview.newResources", icon: FileTextIcon },
    { segment: "practice", labelKey: "overview.challenges", icon: TargetIcon },
] as const

/**
 * The challenge solver, loaded only once a reader actually opens one.
 *
 * A STATIC import would pull the whole solver — markdown renderer, code grader, the UI/UX
 * editor — into EVERY tab of the workspace now that this rail is mounted by the shell,
 * which is far worse than when it only weighed on the landing page. `ssr: false` because
 * the dialog only ever exists after a click, so there is no server pass to render it in.
 */
const ChallengeView = dynamic(
    () =>
        import("@/components/features/challenge/ChallengeView").then(
            (mod) => mod.ChallengeView,
        ),
    { ssr: false },
)

/**
 * Trạng thái ĐANG TẢI của thẻ "Challenges của môn" — ba dòng shimmer cỡ đúng một dòng
 * challenge (icon + tên + chip lifecycle), để thẻ không nhảy cao khi dữ liệu về.
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

/** A rail shortcut card: a title + "see all" link over a small list. */
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

/**
 * Right-hand rail of the subject workspace — the shortcut column that mirrors the left
 * nav sidebar: linked courses · newest resources · newest challenges.
 *
 * SELF-FETCHING on purpose. It is mounted by {@link import("../SubjectWorkspaceShell").SubjectWorkspaceShell},
 * which owns no subject data of its own beyond the code in the route, and threading three
 * more payloads through the shell into every tab would make every tab page carry props it
 * never reads. Every hook here is keyed by the subject code and SWR dedupes by key, so the
 * Overview tab asking for the same workspace aggregate costs no second request.
 *
 * The "Thành viên" facepile that used to live here moved UP into the workspace header
 * (the Facebook-group identity row) — the rail keeps only the go-somewhere shortcuts.
 */
export const SubjectWorkspaceRail = ({ subjectId }: { subjectId: string }) => {
    const t = useTranslations("subjects")
    const router = useRouter()
    const base = `/subjects/${subjectId}`
    const [openedChallengeId, setOpenedChallengeId] = useState<string | null>(null)
    // THU NHỎ = đổi hẳn cách vẽ, không phải để nguyên rồi bóp bề ngang (góp ý #10).
    // `CollapsibleSidebar` chỉ co cột xuống ~4rem và vẫn render nguyên children, nên
    // trước đây ba thẻ này bị ép vào cột hẹp và tiêu đề rơi thành chữ DỌC từng ký tự.
    // Các rail khác đã tự xử qua `useSidebarCollapsed`; rail này thì chưa — giờ có.
    const collapsed = useSidebarCollapsed()

    const { overview } = useQuerySubjectOverviewSwr(subjectId)
    const { subject } = useQuerySubjectSwr(subjectId)
    const {
        challenges,
        isLoading: challengesLoading,
        error: challengesError,
    } = useQuerySubjectCodingChallengesSwr(subjectId)

    const linkedCourses = (subject?.courseLinks ?? []).map((link) => ({
        id: link.id,
        ...getCourseIdentity(link),
    }))
    const newestChallenges = [...challenges]
        .sort((a, b) => Date.parse(b.startsAt ?? "") - Date.parse(a.startsAt ?? ""))
        .slice(0, RAIL_CHALLENGES)
    const newResources = overview?.newResources ?? []

    if (collapsed) {
        return (
            <div className="flex flex-col items-center gap-2">
                {COLLAPSED_SHORTCUTS.map((shortcut) => (
                    <Link
                        key={shortcut.segment}
                        href={`${base}/${shortcut.segment}`}
                        aria-label={t(shortcut.labelKey)}
                        title={t(shortcut.labelKey)}
                        className="flex size-10 items-center justify-center rounded-2xl text-accent no-underline hover:bg-default"
                    >
                        <shortcut.icon aria-hidden focusable="false" className="size-5" />
                    </Link>
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {linkedCourses.length > 0 ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                    <Typography type="body-sm" weight="medium">
                        {t("overview.linkedCourses")}
                    </Typography>
                    {linkedCourses.map((course) => (
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
            ) : null}

            {/* Thẻ rỗng thì ẨN HẲN, không để lại cái hộp có mỗi tiêu đề + "Tất cả". Rail không
                bao giờ rỗng sạch vì thẻ "Challenges" luôn render (nó có cả nhánh rỗng). */}
            {newResources.length > 0 ? (
                <RailCard title={t("overview.newResources")} href={`${base}/resources`} seeAll={t("overview.seeAll")}>
                    {newResources.map((resource) => (
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
            ) : null}

            {/* Thứ tự nhánh BẮT BUỘC là tải → có dòng → lỗi → rỗng, cùng cách gác như bề mặt
                anh em CodingChallengeList (`isLoading && length === 0` → skeleton). Đảo thứ tự
                (hỏi "rỗng?" trước) là nói "chưa có challenge nào" trong lúc còn chưa đọc xong. */}
            <RailCard title={t("overview.challenges")} href={`${base}/practice`} seeAll={t("overview.seeAll")}>
                {challengesLoading && newestChallenges.length === 0 ? (
                    <ChallengeRailSkeleton />
                ) : newestChallenges.length > 0 ? (
                    newestChallenges.map((challenge) => (
                        // Mở TẠI CHỖ thay vì điều hướng — rail này là nơi một đề PE thực sự
                        // được với tới, nên nó là nơi giữ dialog. URL không đổi.
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
                            {/* CHẤM màu, không phải chip chữ (góp ý #22): trong một cột rộng
                                ~17rem, chip "Đang diễn ra" ăn quá nửa hàng nên mọi challenge
                                đều cụt còn "Đề thi…" — tức là mất đúng thứ cần đọc. Màu nói
                                được trạng thái trong 12px; chữ vẫn còn nguyên cho screen
                                reader + tooltip, nên không mất thông tin cho ai cả. */}
                            <span
                                title={t(`practice.coding.lifecycle.${challenge.lifecycle}`)}
                                className={cn(
                                    "size-2.5 shrink-0 rounded-full",
                                    LIFECYCLE_DOT[challenge.lifecycle],
                                )}
                            >
                                <span className="sr-only">
                                    {t(`practice.coding.lifecycle.${challenge.lifecycle}`)}
                                </span>
                            </span>
                        </button>
                    ))
                ) : challengesError ? null : (
                    <Typography type="body-sm" color="muted">
                        {t("overview.noChallenges")}
                    </Typography>
                )}
            </RailCard>

            {/* Đề mở TẠI CHỖ. Cùng khuôn với dialog của ExamList và popup bài viết của
                CommunityFeed: thân dialog là CHÍNH component mà route render, nên popup và
                `/challenges/{id}` không thể trôi khỏi nhau. */}
            <Modal
                isOpen={openedChallengeId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setOpenedChallengeId(null)
                    }
                }}
            >
                <Modal.Backdrop>
                    {/*
                     * Popup lấy gần TRỌN bề ngang màn hình, chỉ chừa máng mỏng hai bên.
                     * Thủ phạm của cái popup "chỉ chiếm khúc giữa" là trần `max-w-6xl`
                     * (72rem): trên màn 1080p trở lên nó bó dialog lại còn chưa tới 2/3
                     * màn, hai bên bỏ trắng, trong khi thứ nằm trong đó là một trang đề
                     * A4 cần được phóng to hết cỡ. Bỏ trần, ghim `sm:w-[96vw]`; máng của
                     * container hạ xuống `sm:p-2` để 96vw + máng vẫn lọt trong viewport.
                     * Dưới `sm` không đặt bề ngang: `.modal__dialog` đã `w-full` và
                     * container còn `w-full` (chỉ `sm:` mới `w-fit`), nên nó tự vừa.
                     *
                     * `h-[92vh]` + `overflow-hidden` là điều kiện để khung xem đề cao lên
                     * được: chiều cao phải ĐI TỪ TRÊN XUỐNG. Để dialog co theo nội dung là
                     * bài toán con gà quả trứng mà nhánh FE (`ExamList`) đã gặp và giải
                     * đúng như thế — popup chỉ cao bằng khung ảnh, mà khung ảnh thì đợi
                     * popup cho chỗ. Ghim chiều cao xong, `ChallengeView` `flex-1` vào và
                     * giữ phần cuộn, khung đề `flex-1` tiếp — thoát cái sàn `60dvh`.
                     *
                     * ★ `max-w-none` KHÔNG PHẢI THỪA. `Modal.Container` không truyền `size`
                     * ⇒ HeroUI lấy `defaultVariants.size = "md"` ⇒ dialog luôn mang class
                     * `modal__dialog--md`, mà `modal.css` bake `.modal__dialog--md { max-width:
                     * 28rem }` trong `@layer components`. Bỏ `max-w-6xl` mà không thay bằng gì
                     * thì không còn utility nào tranh với 28rem: popup HẸP LẠI còn 448px (nhỏ
                     * hơn cả bản cũ) và từ `lg` khung đề `lg:grid-cols-[minmax(0,1fr)_...]` chỉ
                     * còn ~16px cho cột trái — ảnh đề biến mất. Trần mặc định phải được GỠ
                     * TƯỜNG MINH, không phải để trống.
                     */}
                    <Modal.Container className="p-3 sm:p-2">
                        <Modal.Dialog className="h-[92vh] max-h-[92vh] max-w-none overflow-hidden sm:w-[96vw]">
                            <Modal.CloseTrigger
                                aria-label={t("practice.exam.closeExam")}
                                className="z-20"
                            />
                            {openedChallengeId !== null ? (
                                <>
                                    {/* `shrink-0`: dialog giờ cao cố định nên hàng này là
                                        flex item — không được co lại nhường chỗ cho khung
                                        đề, nếu không nút "Mở trang đầy đủ" bị bóp dẹt. */}
                                    <div className="flex shrink-0 justify-end pe-10">
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
        </div>
    )
}
