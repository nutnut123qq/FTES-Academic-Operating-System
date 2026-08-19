"use client"

import React, { useState } from "react"
import { Button, Chip, Modal, Typography } from "@heroui/react"
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

/** lifecycle → chip color. */
const LIFECYCLE_COLOR: Record<ChallengeLifecycle, "success" | "warning" | "default"> = {
    running: "success",
    upcoming: "warning",
    closed: "default",
}

/** How many newest challenges to surface on the rail. */
const RAIL_CHALLENGES = 5

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
                            <Chip size="sm" variant="soft" color={LIFECYCLE_COLOR[challenge.lifecycle]}>
                                {t(`practice.coding.lifecycle.${challenge.lifecycle}`)}
                            </Chip>
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
                `/challenges/{id}` không thể trôi khỏi nhau. Dialog giữ phần cuộn — bên trong
                `ChallengeView` không tự tạo vùng cuộn nào, nên đề dài sẽ bị cắt nếu không. */}
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
        </div>
    )
}
