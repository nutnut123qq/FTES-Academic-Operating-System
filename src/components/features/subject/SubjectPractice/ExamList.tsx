"use client"

import React, { useState } from "react"
import { Button, Chip, Link, Modal, Typography, cn } from "@heroui/react"
import {
    ArrowLeftIcon,
    ArrowSquareOutIcon,
    CaretRightIcon,
    LockSimpleIcon,
    PlusIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SubjectFeAlbum } from "@/components/features/subject/SubjectFeAlbum"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"
import {
    EXAM_ROUTE_SEGMENT,
    useQuerySubjectExamsSwr,
    type SubjectExam,
    type SubjectExamKind,
} from "../hooks/useQuerySubjectExamsSwr"
import { ExamContribute } from "./ExamContribute"
import { ExamModerationQueue } from "./ExamModerationQueue"

/** Props for {@link ExamList}. */
export interface ExamListProps {
    /** The `[subjectId]` route segment (a subject code). */
    subjectId: string
    /** Which exam flavour to list. */
    kind: SubjectExamKind
    /** Back to the practice hub. */
    onBack: () => void
}

/**
 * The Practice tab's list of a subject's **Practical Exams (PE)** or **Final Exams
 * (FE)** — the only surface that lists these two resource types now that they are gone
 * from the Resource tab's taxonomy.
 *
 * A row opens the exam **in a modal, on the spot** — the URL does NOT change, exactly the
 * way `CommunityFeed` opens a post over the feed. The body inside the dialog is the SAME
 * component the exam's own route renders ({@link SubjectFeAlbum}), so the two hosts can
 * never drift apart; the route keeps existing untouched, which is what keeps
 * `/subjects/{id}/practice/fe/{albumId}` alive as a deep link. "Mở trang đầy đủ" inside
 * the dialog is the one control that actually navigates there. Esc + backdrop close
 * (HeroUI default via `onOpenChange`).
 *
 * The dialog hosts **FE albums only**. `kind` still selects which list is fetched and
 * labelled, but the practice page only ever renders this with `kind="fe"` — a PE paper is
 * reached from the subject overview's challenge rail, which opens {@link ChallengeView}
 * itself. A PE arm here would be a branch nothing could execute.
 *
 * Also hosts the two moderation-adjacent surfaces: any signed-in member can contribute
 * an exam (held for review), and a viewer holding a resource-moderation permission gets
 * the pending queue with Duyệt / Từ chối inline.
 *
 * @param props - {@link ExamListProps}
 */
export const ExamList = ({ subjectId, kind, onBack }: ExamListProps) => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const router = useRouter()
    const { guard } = useRequireAuth()
    const { exams, subjectUuid, isLoading, error, mutate } = useQuerySubjectExamsSwr(
        subjectId,
        kind,
    )
    // CONTRACT B: a locked exam's click opens the buy flow of the subject's linked
    // course. `null` when no course is linked — the row then stays inert with a hint.
    const { subject } = useQuerySubjectSwr(subjectId)
    const lockedCourseId = subject?.courseLinks?.[0]?.id ?? null
    const [contributing, setContributing] = useState(false)
    // The exam being read in the modal — `null` = closed. Holding the ROW (not just an id)
    // costs nothing and keeps the dialog's own labels available if they are ever needed.
    const [openedExam, setOpenedExam] = useState<SubjectExam | null>(null)

    const openContribute = guard(() => {
        setContributing(true)
    }, "auth.context.uploadResource")

    /** Human meta line: rating · created date (each part degrades away). */
    const metaLabel = (exam: SubjectExam) => {
        const parts: Array<string> = []
        if (exam.rating !== null) {
            parts.push(
                t("practice.exam.ratingLabel", {
                    rating: exam.rating.toFixed(1),
                    count: exam.ratingCount,
                }),
            )
        }
        if (exam.createdAt) {
            const date = new Date(exam.createdAt)
            if (!Number.isNaN(date.getTime())) {
                parts.push(date.toLocaleDateString(locale))
            }
        }
        return parts.join(" · ")
    }

    /**
     * The exam's own page — the deep link the modal deliberately does NOT navigate to.
     *
     * FE albums only: this list is rendered with `kind="fe"` and no other value, so the PE
     * arm this used to carry was a branch nothing could reach.
     */
    const fullPageHref = (exam: SubjectExam) =>
        `/subjects/${subjectId}/practice/${EXAM_ROUTE_SEGMENT.fe}/${exam.id}`

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-3">
                <Button size="sm" variant="ghost" className="self-start" onPress={onBack}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
                <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <Typography type="h5" weight="bold">
                            {t(`practice.exam.${kind}.title`)}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t(`practice.exam.${kind}.subtitle`)}
                        </Typography>
                    </div>
                    {!contributing ? (
                        <Button size="sm" variant="secondary" onPress={openContribute}>
                            <PlusIcon aria-hidden focusable="false" className="size-4" />
                            {t("practice.exam.contributeCta")}
                        </Button>
                    ) : null}
                </div>
            </div>

            {contributing ? (
                <ExamContribute
                    kind={kind}
                    subjectUuid={subjectUuid}
                    onClose={() => setContributing(false)}
                    onContributed={() => {
                        void mutate()
                    }}
                />
            ) : null}

            {/*
             * KHÔNG gate bằng permission phía client: quyền duyệt của CTV là grant THEO TỪNG MÔN
             * (resource.approve + ScopeType.SUBJECT), mà `state.user.permissions` chỉ chứa leaf
             * GLOBAL — gate ở client sẽ ẩn nút Duyệt khỏi đúng người phải duyệt. Server đã lọc
             * hàng đợi theo `approvableSubjectIds()` (không có quyền → trả RỖNG, không 403), nên
             * cứ render và để queue tự ẩn khi không có gì để duyệt.
             */}
            <ExamModerationQueue
                subjectUuid={subjectUuid}
                kind={kind}
                onModerated={() => {
                    void mutate()
                }}
            />

            <AsyncContent
                isLoading={isLoading && exams.length === 0}
                skeleton={<ExamListSkeleton />}
                isEmpty={exams.length === 0}
                emptyContent={{
                    title: t(`practice.exam.${kind}.empty`),
                    description: t("practice.exam.emptyHint"),
                }}
                error={exams.length === 0 ? error : undefined}
                errorContent={{
                    title: t("practice.exam.loadError"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("practice.exam.retry"),
                }}
            >
                {/*
                 * ponytail: `w-full` trên MỖI row là bắt buộc, không phải thừa. HeroUI bake
                 * `@apply ... h-fit w-fit ...` vào `.link` (@heroui/styles/dist/components/link.css),
                 * mà `width: fit-content` KHÔNG phải `auto` nên `align-items: stretch` của flex
                 * column không kéo item ra được → mỗi thẻ co đúng bằng độ dài tiêu đề, ra 4 thẻ
                 * 4 chiều rộng khác nhau. `w-full` (layer utilities) thắng `.link` (layer
                 * components) nên đè được. Có `w-full` thì `min-w-0 flex-1` + `truncate` bên
                 * dưới mới thực sự cắt tiêu đề dài thay vì kéo dãn thẻ.
                 *
                 * `h-full` cùng gốc đó: lưới 2 cột vốn `stretch` sẵn, nhưng `height: fit-content`
                 * của `.link` KHÔNG phải `auto` nên stretch không kéo cao được → hai thẻ cùng hàng
                 * lệch chiều cao khi `metaLabel()` trả rỗng (đề chưa có rating lẫn ngày → dòng meta
                 * mất hẳn line box). Đè bằng utility, y hệt `w-full`.
                 */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {exams.map((exam) =>
                        exam.lockedForViewer ? (
                            // Purchasers-only exam the viewer hasn't bought: no body/URL
                            // affordance at all, the row opens the course's buy page.
                            <Link
                                key={exam.id}
                                onPress={() => {
                                    if (lockedCourseId) {
                                        router.push(`/courses/${lockedCourseId}`)
                                    }
                                }}
                                aria-label={`${exam.title} — ${t("practice.exam.lockedAria")}`}
                                className={cn(
                                    "flex h-full w-full items-center gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors",
                                    lockedCourseId
                                        ? "cursor-pointer hover:border-accent/50 hover:bg-accent/5"
                                        : "cursor-default",
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {exam.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {lockedCourseId
                                            ? t("practice.exam.unlockHint")
                                            : t("practice.exam.lockedNeutralHint")}
                                    </Typography>
                                </div>
                                <Chip size="sm" variant="soft" color="warning">
                                    <span className="flex items-center gap-1">
                                        <LockSimpleIcon
                                            aria-hidden
                                            focusable="false"
                                            className="size-4"
                                        />
                                        {t("practice.exam.lockedBadge")}
                                    </span>
                                </Chip>
                            </Link>
                        ) : (
                            // The WHOLE row opens the exam. It already carried the
                            // hover-highlight of a clickable row while only the button
                            // actually did anything — so every press on the title (the
                            // obvious target) did nothing at all. The locked variant
                            // above was a real row-link the whole time; this matches it.
                            <Link
                                key={exam.id}
                                onPress={() => setOpenedExam(exam)}
                                aria-label={exam.title}
                                className="flex h-full w-full cursor-pointer items-center gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors hover:border-accent/50 hover:bg-accent/5"
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {exam.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {metaLabel(exam)}
                                    </Typography>
                                </div>
                                {/* Caret, not a button: the row IS the action now, and a
                                    second control inside a link is a second tab stop that
                                    goes exactly where the link already goes. */}
                                <CaretRightIcon
                                    aria-hidden
                                    focusable="false"
                                    className="size-4 shrink-0 text-muted"
                                />
                            </Link>
                        ),
                    )}
                </div>
            </AsyncContent>

            {/* Đề mở TẠI CHỖ trong modal (khuôn CommunityFeed): thân dialog chính là component
                mà route của đề đang render, nên modal và deep link không bao giờ lệch nhau.
                URL KHÔNG đổi — muốn sang trang thật thì bấm "Mở trang đầy đủ".
                Esc + bấm nền đóng (mặc định HeroUI qua `onOpenChange`). */}
            <Modal
                isOpen={openedExam !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setOpenedExam(null)
                    }
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container className="p-3 sm:p-6">
                        {/*
                         * Khuôn lấy NGUYÊN theo `CommunityPhotoLightboxModal`
                         * (`h-[90vh] max-h-[90vh] w-[95vw] max-w-6xl overflow-hidden`). Bề ngang
                         * vốn đã bằng nhau rồi; thứ còn thiếu là CHIỀU CAO CỐ ĐỊNH. Để dialog co
                         * theo nội dung là bài toán con gà quả trứng: popup chỉ cao bằng khung ảnh,
                         * mà khung ảnh thì đang đợi popup cho chỗ — nên ảnh đề mãi kẹt ở cái sàn
                         * `60dvh`. Ghim `h-[90vh]` là `SubjectFeAlbum` có cái để `flex-1` vào, và
                         * ảnh (`object-contain`) lớn theo khung.
                         *
                         * ponytail: vùng cuộn vẫn chia y như cũ — nhánh FE để dialog KHÔNG cuộn,
                         * phần cuộn nằm trong album (thêm một tầng nữa là hai thanh cuộn lồng nhau);
                         * `ChallengeView` (PE) không tạo vùng cuộn con nào (nó xếp dọc hết) nên
                         * nhánh PE giữ nguyên `max-h` + cuộn ở chính dialog.
                         */}
                        <Modal.Dialog
                            className={cn(
                                "w-[95vw] max-w-6xl",
                                kind === "pe"
                                    ? "max-h-[90vh] overflow-y-auto"
                                    : "h-[90vh] max-h-[90vh] overflow-hidden",
                            )}
                        >
                            <Modal.CloseTrigger
                                aria-label={t("practice.exam.closeExam")}
                                className="z-20"
                            />
                            {openedExam ? (
                                <>
                                    {/* `pe-10` chừa chỗ cho × (absolute `top-4 right-4`). */}
                                    <div className="mb-2 flex pe-10">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onPress={() => {
                                                router.push(fullPageHref(openedExam))
                                            }}
                                        >
                                            <ArrowSquareOutIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-4"
                                            />
                                            {t("practice.exam.openFullPage")}
                                        </Button>
                                    </div>
                                    {/* FE only. PE never reaches this component — the practice
                                        page renders ExamList with kind="fe" and nothing else
                                        (SubjectPractice/index.tsx), and a PE paper is opened
                                        from the subject overview's challenge rail instead.
                                        Two traps if anyone wires PE in here: `SubjectExam.id`
                                        is a RESOURCE uuid while ChallengeView wants a routing
                                        SLUG, and `EXAM_ROUTE_SEGMENT.pe` names a
                                        `practice/pe/...` route that has never existed. */}
                                    <SubjectFeAlbum
                                        albumId={openedExam.id}
                                        subjectId={subjectId}
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

/** Loading skeleton — mirrors the exam rows (title/meta text + open button). */
const ExamListSkeleton = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[68px] w-full rounded-2xl" />
        ))}
    </div>
)
