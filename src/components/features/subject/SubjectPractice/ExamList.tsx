"use client"

import React, { useState } from "react"
import { Button, Chip, Link, Modal, Typography, cn } from "@heroui/react"
import {
    ArrowLeftIcon,
    CaretRightIcon,
    LockSimpleIcon,
    PlusIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { SubjectFeAlbum } from "@/components/features/subject/SubjectFeAlbum"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"
import {
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
 * `/subjects/{id}/practice/fe/{albumId}` alive as a deep link — reachable by URL, just no
 * longer advertised by a button in here. Esc + backdrop close (HeroUI default via
 * `onOpenChange`).
 *
 * **Full screen is the DIALOG's job.** The viewer's bottom toolbar draws the expand switch
 * (`ArrowsOut`), but what expanding has to grow is this dialog — so `SubjectFeAlbum` reports
 * the toggle up here and the dialog swaps its 95vw/90vh box for the whole viewport. The
 * album's own expanded frame (a `fixed inset-0` overlay) is deliberately NOT used in this
 * host: a fixed box inside an animating dialog resolves against the dialog, not the
 * viewport, which is exactly why the button used to be withheld here.
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
    // Mirrors the album's full-screen switch. The state it MIRRORS still lives in the album
    // (`useExamExpand`) — this is only what the dialog needs to know to grow, which is the
    // one thing the album cannot do for itself.
    const [isExamExpanded, setIsExamExpanded] = useState(false)

    const openContribute = guard(() => {
        setContributing(true)
    }, "auth.context.uploadResource")

    /**
     * Human meta line: **who uploaded it · when** — each part degrading away on its own.
     *
     * The rating it used to lead with ("0.0 sao (0 đánh giá)") was a number nobody has ever
     * given: no surface in the app rates an exam, so every row on every subject read the
     * same zero, and the one fact a reader actually wants from a contributed paper — who
     * put it there — was missing.
     *
     * The time is the SAME relative label the album's own header prints for the picture in
     * front of the reader ({@link formatRelativeTime}, the community feed's), so opening a
     * row does not restate the same fact in a second wording. It returns `""` for a
     * missing/invalid timestamp, which the filter below drops — so a row with neither part
     * renders an empty line rather than a dangling " · ".
     */
    const metaLabel = (exam: SubjectExam) =>
        [exam.uploaderName, formatRelativeTime(exam.createdAt, locale)]
            .filter((part): part is string => Boolean(part))
            .join(" · ")

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
                URL KHÔNG đổi; `/subjects/{id}/practice/fe/{albumId}` vẫn sống nguyên như deep
                link, chỉ là không còn nút nào trong này quảng cáo nó nữa.
                Esc + bấm nền đóng (mặc định HeroUI qua `onOpenChange`). */}
            <Modal
                isOpen={openedExam !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setOpenedExam(null)
                        // Đóng lúc đang toàn màn hình thì lần mở sau phải bắt đầu lại ở khuôn
                        // neo: album unmount nên `useExamExpand` tự về false, còn cờ MIRROR ở
                        // đây thì không ai gỡ hộ — để sót là mở đề kế tiếp ra đã full màn hình.
                        setIsExamExpanded(false)
                    }
                }}
            >
                {/* Escape hands the dialog back to the ALBUM while it is full screen: the
                    viewer's own Escape handler collapses it there ("how do I get out of this"
                    must answer the layer the reader is actually in), and only once docked does
                    Escape mean "close the exam" again. React Aria checks this flag BEFORE it
                    stops the event, so the viewer's window listener still sees the keypress. */}
                <Modal.Backdrop isKeyboardDismissDisabled={isExamExpanded}>
                    {/* Full screen bleeds to the edges: `size="full"` is HeroUI's own recipe
                        for that (it drops the container gutter and the dialog's radius/shadow,
                        and swaps the zoom-in entrance for a straight one). `sm:w-full` is the
                        one thing the recipe leaves behind — `.modal__container` bakes
                        `sm:w-fit`, and a `w-full` dialog inside a `w-fit` container has nothing
                        definite to resolve against. */}
                    <Modal.Container
                        size={isExamExpanded ? "full" : undefined}
                        className={isExamExpanded ? "sm:w-full" : "p-3 sm:p-2"}
                    >
                        {/*
                         * CHIỀU CAO CỐ ĐỊNH là thứ khung ảnh cần: để dialog co theo nội dung là
                         * bài toán con gà quả trứng — popup chỉ cao bằng khung ảnh, mà khung ảnh
                         * thì đang đợi popup cho chỗ, nên ảnh đề mãi kẹt ở cái sàn `60dvh`. Ghim
                         * `h-[92vh]` là `SubjectFeAlbum` có cái để `flex-1` vào, và ảnh
                         * (`object-contain`) lớn theo khung. Dialog KHÔNG cuộn: phần cuộn nằm
                         * trong album (thêm một tầng nữa là hai thanh cuộn lồng nhau).
                         *
                         * BỀ NGANG: bỏ trần `max-w-6xl` (72rem) — chính nó bó popup lại còn khúc
                         * giữa màn hình và bỏ trắng hai bên, trong khi thứ nằm trong đó là trang
                         * đề A4 cần phóng to hết cỡ. `sm:w-[96vw]` + máng container `sm:p-2` =
                         * gần trọn bề ngang, chừa máng mỏng. Dưới `sm` không đặt bề ngang:
                         * `.modal__dialog` đã `w-full` và container cũng `w-full` ở cỡ đó.
                         * Cùng con số với popup đề PE của `SubjectWorkspaceRail` — hai bề mặt
                         * của cùng một sản phẩm thì không được lệch khuôn nhau.
                         *
                         * EXPANDED thì cái hộp đó chính là thứ phải biến mất: giữ nguyên
                         * `96vw/92vh` thì bấm "toàn màn hình" xong vẫn là cái popup cũ — nút
                         * trông như hỏng. Ghi thẳng bằng utility (không nhờ `.modal__dialog--full`)
                         * để không có utility nào phải tranh với utility ngược lại: chuỗi class
                         * được HOÁN nguyên cụm, đúng lối `useExamExpand` làm với khung 2 cột.
                         *
                         * ★ `max-w-none` KHÔNG PHẢI THỪA. `Modal.Container` không truyền `size`
                         * ⇒ HeroUI lấy `defaultVariants.size = "md"` ⇒ dialog luôn mang class
                         * `modal__dialog--md`, mà `modal.css` bake `.modal__dialog--md { max-width:
                         * 28rem }` trong `@layer components`. Bỏ `max-w-6xl` mà không thay bằng
                         * gì thì không còn utility nào tranh với 28rem: popup HẸP LẠI còn 448px
                         * (nhỏ hơn cả bản cũ), `sm:w-[96vw]` set `width` xong bị `max-width` cắt.
                         * Trần mặc định phải được GỠ TƯỜNG MINH.
                         */}
                        <Modal.Dialog
                            className={
                                isExamExpanded
                                    ? "h-full max-h-full w-full overflow-hidden rounded-none"
                                    : "h-[92vh] max-h-[92vh] max-w-none overflow-hidden sm:w-[96vw]"
                            }
                        >
                            <Modal.CloseTrigger
                                aria-label={t("practice.exam.closeExam")}
                                className="z-20"
                            />
                            {/* FE only. PE never reaches this component — the practice page
                                renders ExamList with kind="fe" and nothing else
                                (SubjectPractice/index.tsx), and a PE paper is opened from the
                                subject overview's challenge rail instead. Two traps if anyone
                                wires PE in here: `SubjectExam.id` is a RESOURCE uuid while
                                ChallengeView wants a routing SLUG, and a `practice/pe/...`
                                route has never existed at all. */}
                            {openedExam ? (
                                <SubjectFeAlbum
                                    albumId={openedExam.id}
                                    subjectId={subjectId}
                                    inModal
                                    onExpandedChange={setIsExamExpanded}
                                />
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
