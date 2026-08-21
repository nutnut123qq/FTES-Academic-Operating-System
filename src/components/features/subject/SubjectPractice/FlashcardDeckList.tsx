"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { ArrowLeftIcon, LockSimpleIcon, StackIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { RestError } from "@/modules/api/rest/client/client"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { Link } from "@/i18n/navigation"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useQuerySubjectFlashcardsSwr } from "../hooks/useQuerySubjectFlashcardsSwr"
import { reviewFlashcard } from "@/modules/api/rest/subject"
import type {
    FlashcardCardView,
    FlashcardDeckView,
} from "@/modules/api/rest/subject/types"

/**
 * Ghim ảnh trong mặt thẻ vào bề ngang khung.
 *
 * Ảnh đề quét rộng 1440px và renderer Markdown dùng chung KHÔNG đặt ràng buộc nào cho `img`
 * (nó phục vụ cả trang đọc rộng), nên để nguyên là thẻ tràn ngang trên màn hẹp. Ghim tại đây
 * thay vì sửa renderer chung: bề mặt khác có thể đang cố ý cần ảnh tràn viền.
 */
const CARD_MARKDOWN = "[&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg"

/**
 * Nội dung một MẶT thẻ: cao tối đa 60% màn hình, quá thì CUỘN TRONG mặt đó.
 *
 * Vì sao chặn chiều cao thay vì để thẻ dài ra: giải thích của nguồn có bài dài cả màn hình, để
 * thẻ tự cao thì nút "Thẻ tiếp theo" bị đẩy khuất dưới đáy — lật xong phải cuộn cả trang mới
 * đi tiếp được, và mặt trước ngắn thì khung vẫn cao lêu nghêu vì hai mặt chung một ô lưới.
 *
 * Cuộn đặt ở lớp BÊN TRONG mặt thẻ, không đặt thẳng lên mặt: `overflow` trên phần tử đang mang
 * `backface-visibility` làm trình duyệt bẹt lớp 3D, mặt sau sẽ lòi ra khi chưa lật.
 */
const FACE_SCROLL = "max-h-[60vh] min-h-0 w-full overflow-y-auto overscroll-contain"

/**
 * Bốn mức tự chấm, ánh xạ sang thang SM-2 0..5 của BE.
 *
 * Bốn mức chứ không phải sáu: thang 0..5 là chuyện của thuật toán, còn người học chỉ phân biệt
 * được "quên hẳn / phải nghĩ lâu / nhớ được / quá dễ". Bày đủ sáu nút thì người ta bấm bừa, mà
 * điểm bừa là lịch ôn sai.
 */
const GRADES: Array<{ key: string; score: number; variant: "secondary" | "tertiary" }> = [
    { key: "again", score: 0, variant: "secondary" },
    { key: "hard", score: 3, variant: "tertiary" },
    { key: "good", score: 4, variant: "tertiary" },
    { key: "easy", score: 5, variant: "tertiary" },
]

/** Where a reader goes to buy the membership that unlocks the paid decks. */
const MEMBERSHIP_HREF = "/dashboard?tab=plan"

interface FlashcardDeckListProps {
    /** Subject CODE (the practice routes key on the code, not the uuid). */
    subjectCode: string
    onBack: () => void
}

/**
 * The subject's flashcard shelf, and the study session that runs off it.
 *
 * The paywall is the BE's: a paid deck reaches this component with only `previewLimit`
 * cards and `locked = true`, so the session below simply runs out of cards and the upsell
 * takes over. Nothing here filters, blurs or hides a card the server already sent — that
 * would be a lock made of CSS, and the cards would still be one devtools panel away.
 *
 * `deck.cardCount` is the deck's REAL size even while locked; `deck.cards.length` is what
 * the reader may study. The two differ on purpose and the copy leans on both: "5 of 392".
 */
export const FlashcardDeckList = ({ subjectCode, onBack }: FlashcardDeckListProps) => {
    const t = useTranslations("subjects")
    const { view, isLoading, error, mutate } = useQuerySubjectFlashcardsSwr(subjectCode)
    const [openDeckId, setOpenDeckId] = useState<string | null>(null)

    /**
     * The deck endpoint is signed-in only (anonymous → 401) while the subject page itself is
     * public. Letting that 401 fall into the generic load error would hand a guest a "could
     * not load" box whose Retry button fails forever, with nothing anywhere saying "sign in"
     * — the exact trap the Coding module already documents. A guest gets the invitation.
     */
    const signedOut = error instanceof RestError && error.status === 401

    const openDeck = useMemo(
        () => view?.decks.find((deck) => deck.id === openDeckId) ?? null,
        [view, openDeckId],
    )

    if (openDeck) {
        return (
            <StudySession
                subjectCode={subjectCode}
                deck={openDeck}
                onBack={() => setOpenDeckId(null)}
                onGraded={() => { void mutate() }}
            />
        )
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="h5" weight="bold">
                    {t("practice.flashcards.title")}
                </Typography>
                <Button size="sm" variant="tertiary" className="shrink-0" onPress={onBack}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
            </div>

            <AsyncContent
                isLoading={isLoading && !view}
                skeleton={<DeckListSkeleton />}
                error={view || signedOut ? undefined : error}
                errorContent={{
                    title: t("practice.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("practice.retry"),
                }}
            >
                {signedOut ? (
                    <MembershipBanner signedOut />
                ) : view && view.decks.length === 0 ? (
                    <EmptyContent title={t("practice.flashcards.empty")} />
                ) : (
                    <div className="flex flex-col gap-3">
                        {view?.hasFullAccess === false ? <MembershipBanner /> : null}
                        {view?.decks.map((deck) => (
                            <DeckRow
                                key={deck.id}
                                deck={deck}
                                onOpen={() => setOpenDeckId(deck.id)}
                            />
                        ))}
                    </div>
                )}
            </AsyncContent>
        </div>
    )
}

/** One deck row: name, how much of it the reader may study, and the way in. */
const DeckRow = ({ deck, onOpen }: { deck: FlashcardDeckView; onOpen: () => void }) => {
    const t = useTranslations("subjects")

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex w-full items-center gap-3 rounded-2xl border border-default p-4 text-start"
        >
            <StackIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography type="body" weight="medium" className="group-hover:underline" truncate>
                    {deck.title}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {deck.locked
                        ? t("practice.flashcards.previewMeta", {
                            preview: deck.cards.length,
                            total: deck.cardCount,
                        })
                        : t("practice.flashcards.cardMeta", { total: deck.cardCount })}
                    {/* Số thẻ ĐẾN HẠN là thứ quyết định hôm nay có mở bộ này hay không — quan
                        trọng hơn tổng số thẻ, nên đứng ngay cạnh. */}
                    {deck.dueCount > 0
                        ? ` · ${t("practice.flashcards.dueMeta", { count: deck.dueCount })}`
                        : ""}
                </Typography>
            </div>
            {deck.locked ? (
                <Chip size="sm" color="warning" variant="soft" className="shrink-0">
                    <LockSimpleIcon aria-hidden focusable="false" className="size-3.5" />
                    {t("practice.flashcards.locked")}
                </Chip>
            ) : null}
        </button>
    )
}

/** The upsell. Shown once above the shelf, not repeated on every locked deck. */
const MembershipBanner = ({ signedOut = false }: { signedOut?: boolean }) => {
    const t = useTranslations("subjects")

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning bg-warning/10 p-4">
            <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-warning" />
            <Typography type="body-sm" className="min-w-0 flex-1">
                {signedOut
                    ? t("practice.flashcards.signedOut")
                    : t("practice.flashcards.upsell")}
            </Typography>
            <Link href={MEMBERSHIP_HREF} className="shrink-0 no-underline">
                <Button size="sm" variant="primary">
                    {t("practice.flashcards.subscribe")}
                </Button>
            </Link>
        </div>
    )
}

/**
 * A study run through one deck: show the front, reveal the back, move on.
 *
 * Reaching the end of a LOCKED deck is not an empty state — it is the moment the reader
 * has just felt the value and is the single best place to ask for the membership, so the
 * end card carries the CTA instead of a bare "done".
 */
const StudySession = ({
    subjectCode,
    deck,
    onBack,
    onGraded,
}: {
    subjectCode: string
    deck: FlashcardDeckView
    onBack: () => void
    onGraded: () => void
}) => {
    const t = useTranslations("subjects")
    const [index, setIndex] = useState(0)
    const [revealed, setRevealed] = useState(false)
    const [grading, setGrading] = useState(false)

    /**
     * Hàng đợi của phiên: thẻ ĐẾN HẠN trước, hết hạn rồi thì học cả bộ.
     *
     * Chốt MỘT LẦN khi mở bộ (`deck.id`), không tính lại mỗi lần chấm: chấm xong thẻ hết "đến
     * hạn" ngay, nếu hàng đợi tính lại theo `deck.cards` thì thẻ vừa học biến khỏi danh sách và
     * mọi thẻ phía sau nhảy chỉ số — người học bị đá sang thẻ khác giữa chừng.
     */
    const queue = useMemo(() => {
        const due = deck.cards.filter((c) => c.progress?.due)
        return due.length > 0 ? due : deck.cards
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deck.id])

    const card: FlashcardCardView | undefined = queue[index]
    const finished = !card

    const next = () => {
        setRevealed(false)
        setIndex((current) => current + 1)
    }

    /**
     * Tự chấm theo SM-2 (BE xếp lịch, FE chỉ gửi điểm).
     *
     * Lỗi mạng KHÔNG chặn người học đi tiếp: mất một lần ghi tiến độ thì thẻ đơn giản là còn đến
     * hạn, còn dựng lên một hộp lỗi giữa phiên ôn thì hỏng cả mạch học.
     */
    const grade = async (score: number) => {
        if (!card || grading) return
        setGrading(true)
        try {
            await reviewFlashcard(subjectCode, card.id, { grade: score })
            onGraded()
        } catch {
            // im lặng có chủ đích — xem ghi chú trên
        } finally {
            setGrading(false)
            next()
        }
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="h5" weight="bold" truncate>
                    {deck.title}
                </Typography>
                <Button size="sm" variant="tertiary" className="shrink-0" onPress={onBack}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
            </div>

            {finished ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-default p-8 text-center">
                    <Typography type="body" weight="medium">
                        {deck.locked
                            // `remaining` = tổng thật TRỪ phần đã học thử. Truyền thẳng
                            // `cardCount` là nói "còn 251 thẻ" ngay sau khi người ta vừa học 5
                            // thẻ trong đúng bộ 251 thẻ đó — thừa 5, và sai ở chỗ dễ soi nhất.
                            ? t("practice.flashcards.previewOver", {
                                preview: deck.cards.length,
                                remaining: Math.max(0, deck.cardCount - deck.cards.length),
                            })
                            : t("practice.flashcards.sessionDone")}
                    </Typography>
                    {deck.locked ? (
                        <Link href={MEMBERSHIP_HREF} className="no-underline">
                            <Button size="sm" variant="primary">
                                {t("practice.flashcards.subscribe")}
                            </Button>
                        </Link>
                    ) : (
                        <Button size="sm" variant="tertiary" onPress={() => { setIndex(0); setRevealed(false) }}>
                            {t("practice.flashcards.restart")}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <Typography type="body-xs" color="muted">
                        {t("practice.flashcards.position", {
                            index: index + 1,
                            // Bộ đang KHOÁ thì mẫu số là TỔNG THẺ THẬT, không phải số thẻ học
                            // thử: "Thẻ 5/5" trông như đã học hết bộ, còn "Thẻ 5/251" mới nói
                            // đúng rằng người học mới chạm phần đầu của kho.
                            total: deck.locked ? deck.cardCount : queue.length,
                        })}
                    </Typography>

                    {/* LẬT thẻ, không phải bấm nút hiện đáp án: thẻ ghi nhớ là hai MẶT của một
                        vật, và động tác lật chính là thứ bắt người học tự trả lời trong đầu
                        trước khi thấy đáp án. Một nút "xem đáp án" cạnh thẻ thì đáp án chỉ là
                        khối chữ hiện thêm ra — mất luôn khoảnh khắc tự kiểm tra đó. */}
                    <button
                        type="button"
                        onClick={() => setRevealed((shown) => !shown)}
                        aria-pressed={revealed}
                        aria-label={t("practice.flashcards.flipHint")}
                        className="group w-full text-start [perspective:1200px]"
                    >
                        <div
                            className={cn(
                                // Hai mặt XẾP CHỒNG trong CÙNG một ô grid, không dùng absolute:
                                // absolute thì chiều cao khung chỉ theo mặt trước, nên đáp án dài
                                // (hoặc ảnh cao hơn) bị cắt cụt khi lật. Grid thì khung cao bằng
                                // mặt cao nhất, cả hai mặt đều vừa.
                                "grid transition-transform duration-500 [transform-style:preserve-3d]",
                                // Người bật "giảm chuyển động" thì đổi mặt tức thì — vẫn đúng
                                // chức năng, chỉ bỏ phần quay.
                                "motion-reduce:transition-none",
                                revealed && "[transform:rotateY(180deg)]",
                            )}
                        >
                            <div
                                className={cn(
                                    "col-start-1 row-start-1 flex min-h-[12rem] flex-col items-center justify-center",
                                    "rounded-2xl border border-default p-6 text-center [backface-visibility:hidden]",
                                )}
                            >
                                {/* Markdown, KHÔNG phải chữ thuần: có môn (Toán, Trung) ra đề bằng
                                    ẢNH — cả câu hỏi lẫn phương án nằm trong một tấm hình — nên mặt
                                    thẻ lưu `![](url)`. Render chữ thuần thì người học chỉ thấy một
                                    dòng link. `math` bật vì phần lớn thẻ ảnh là môn Toán, thẻ chữ
                                    có công thức cũng hiện đúng thay vì trơ ra `$...$`. */}
                                <div className={FACE_SCROLL}>
                                    <MarkdownContent markdown={card.front} math className={CARD_MARKDOWN} />
                                </div>
                            </div>
                            <div
                                className={cn(
                                    "col-start-1 row-start-1 flex min-h-[12rem] flex-col items-center justify-center",
                                    "rounded-2xl border border-accent bg-accent/5 p-6 text-center",
                                    "[backface-visibility:hidden] [transform:rotateY(180deg)]",
                                )}
                            >
                                <div className={FACE_SCROLL}>
                                    <MarkdownContent markdown={card.back} math className={CARD_MARKDOWN} />
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Chưa lật thì KHÔNG hiện nút chấm: chấm khi chưa thấy đáp án là chấm bừa,
                        và SM-2 lấy chính điểm đó để xếp lịch nên bừa một lần là lệch lịch nhiều
                        ngày. Lật xong mới có gì để tự đánh giá. */}
                    {revealed ? (
                        <div className="flex flex-wrap gap-2">
                            {GRADES.map((g) => (
                                <Button
                                    key={g.score}
                                    size="sm"
                                    variant={g.variant}
                                    isDisabled={grading}
                                    onPress={() => { void grade(g.score) }}
                                >
                                    {t(`practice.flashcards.grade.${g.key}`)}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <Typography type="body-xs" color="muted">
                            {t("practice.flashcards.flipHint")}
                        </Typography>
                    )}
                </div>
            )}
        </div>
    )
}

/** Skeleton of the shelf — three rows at the real row height, so nothing jumps. */
const DeckListSkeleton = () => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-2xl" />
        ))}
    </div>
)
