"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Typography, cn } from "@heroui/react"
import {
    ArrowClockwiseIcon,
    CheckCircleIcon,
    CursorClickIcon,
    PencilSimpleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useGetLessonFlashcardsSwr } from "@/hooks/swr/api/rest/queries"
import { LessonFlashcardManager } from "./LessonFlashcardManager"
import { useLessonAiStream } from "./useLessonAiStream"

/** Props for {@link LessonAiFlashcards}. */
export interface LessonAiFlashcardsProps {
    /** The current lesson id (`contentId` route param) — grounds generation. */
    lessonId: string
}

/** One parsed Q/A flashcard. */
interface Flashcard {
    q: string
    a: string
}

/**
 * Best-effort extraction of a `[{ "q": …, "a": … }]` array from a streamed AI
 * answer. Tolerates ```json code fences / leading prose by slicing between the
 * first `[` and the last `]`. Returns [] when nothing valid parses.
 */
const parseFlashcards = (raw: string): Array<Flashcard> => {
    const start = raw.indexOf("[")
    const end = raw.lastIndexOf("]")
    if (start === -1 || end === -1 || end <= start) {
        return []
    }
    try {
        const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown
        if (!Array.isArray(parsed)) {
            return []
        }
        return parsed
            .map((item) => {
                const record = item as Record<string, unknown>
                const q = typeof record?.q === "string" ? record.q : ""
                const a = typeof record?.a === "string" ? record.a : ""
                return { q: q.trim(), a: a.trim() }
            })
            .filter((card) => card.q.length > 0 && card.a.length > 0)
    } catch {
        return []
    }
}

/**
 * AI Flashcard — generates Q/A flashcards from the CURRENT lesson (grounded via the
 * reused TUTOR_CHAT stream with a "produce N flashcards as JSON" prompt — there is
 * no lesson-scoped flashcard endpoint reachable from the client), then renders a
 * simple flip-card reviewer (mirrors `PracticeFlashcards`: one card at a time, flip
 * front↔back, a "Card i/total" meter, prev/next, and a done summary). Generation
 * runs when the panel opens; Regenerate re-runs it.
 *
 * This component is mounted by {@link LessonAiStudy} for UNLOCKED VIDEO lessons
 * only; document/link lessons never render it.
 *
 * @param props - {@link LessonAiFlashcardsProps}
 */
export const LessonAiFlashcards = ({ lessonId }: LessonAiFlashcardsProps) => {
    const t = useTranslations("contentAi")
    const { text, isStreaming, error, generate } = useLessonAiStream(lessonId)

    /**
     * Bộ thẻ do giảng viên soạn được HỎI TRƯỚC. Có bộ tay thì đó là nguồn duy nhất — không gọi
     * model lần nào (góp ý website 2026-07-26: AI đề xuất câu ngoài lề, lõi nên là câu hỏi
     * người soạn). `isLoading` của SWR quyết định thời điểm được phép sinh AI: sinh trong lúc
     * còn đang hỏi là vừa đốt quota vừa có thể ghi đè bộ tay vừa về.
     */
    const authoredSwr = useGetLessonFlashcardsSwr(lessonId)
    const authored = authoredSwr.data?.source === "AUTHORED" ? authoredSwr.data.cards : null
    /** Người quản khoá được vào màn soạn; học viên không bao giờ thấy lối vào này. */
    const canManage = authoredSwr.data?.canManage ?? false
    const [managing, setManaging] = useState(false)
    /** Chỉ thẻ PUBLISHED tới tay học viên; DRAFT là bản nháp của người soạn. */
    const authoredCards = useMemo(
        () =>
            (authored ?? [])
                .filter((card) => card.status === "PUBLISHED")
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((card) => ({ q: card.front, a: card.back })),
        [authored],
    )
    const hasAuthored = authoredCards.length > 0

    const [currentIndex, setCurrentIndex] = useState(0)
    const [revealed, setRevealed] = useState(false)

    const runGenerate = useCallback(() => {
        setCurrentIndex(0)
        setRevealed(false)
        void generate(t("flashcard.prompt"))
    }, [generate, t])

    // Sinh bằng AI CHỈ khi bài không có bộ tay. Chờ SWR xong mới quyết (kể cả khi hỏng — 403
    // của bài chưa mở khoá vẫn để luồng AI cũ tự xử như trước).
    useEffect(() => {
        if (authoredSwr.isLoading || hasAuthored) {
            return
        }
        runGenerate()
        // deps CỐ Ý chỉ có 2 cờ nguồn: `runGenerate` đổi identity theo `t`/stream nên đưa vào là
        // sinh lại thẻ mỗi lần đổi ngôn ngữ hay stream nhích — đốt quota vô cớ.
    }, [authoredSwr.isLoading, hasAuthored])

    // parse the (final) streamed JSON; only trust it once the stream settles
    const aiCards = useMemo(() => (isStreaming ? [] : parseFlashcards(text)), [isStreaming, text])
    const cards = hasAuthored ? authoredCards : aiCards

    const card = cards[currentIndex] ?? null
    const done = cards.length > 0 && currentIndex >= cards.length
    const isFirst = currentIndex === 0
    const isLast = cards.length > 0 && currentIndex === cards.length - 1

    const goPrev = () => {
        setRevealed(false)
        setCurrentIndex((index) => Math.max(index - 1, 0))
    }
    const goNext = () => {
        setRevealed(false)
        setCurrentIndex((index) => index + 1)
    }
    const restart = () => {
        setCurrentIndex(0)
        setRevealed(false)
    }

    // parsing failed (stream done, text present, but no valid cards) → treat as error
    const parseFailed = !hasAuthored && !isStreaming && text.length > 0 && aiCards.length === 0
    const isLoadingFirst = authoredSwr.isLoading || (!hasAuthored && isStreaming)

    return (
        <div className="flex flex-col gap-4">
            {/* Bộ do giảng viên soạn: nói rõ để học viên biết đây là câu hỏi trọng tâm người dạy
                chọn, không phải máy đoán — đó chính là điều góp ý đòi. */}
            <div className="flex items-center justify-between gap-2">
                {hasAuthored ? (
                    <Typography type="body-xs" color="muted">
                        {t("flashcard.authoredBy")}
                    </Typography>
                ) : <span />}
                {canManage ? (
                    <Button variant="tertiary" size="sm" onPress={() => setManaging((prev) => !prev)}>
                        <PencilSimpleIcon aria-hidden focusable="false" className="size-4" />
                        {managing ? t("flashcard.manage.exit") : t("flashcard.manage.enter")}
                    </Button>
                ) : null}
            </div>

            {/* Soạn thẻ THAY vùng ôn tập, không hiện song song: hai danh sách cùng lúc (một bản
                nháp, một bản học viên thấy) là mời nhầm lẫn. */}
            {managing ? (
                <LessonFlashcardManager
                    lessonId={lessonId}
                    cards={authoredSwr.data?.cards ?? []}
                    aiDrafts={aiCards}
                    onChanged={() => void authoredSwr.mutate()}
                />
            ) : (
                <AsyncContent
                    isLoading={isLoadingFirst}
                    skeleton={<Skeleton className="mx-auto h-56 w-full max-w-lg rounded-large" />}
                    isEmpty={!hasAuthored && !isStreaming && !error && !parseFailed && text.length === 0}
                    emptyContent={{ title: t("flashcard.empty") }}
                    error={!hasAuthored && (error || parseFailed) ? new Error(error ?? "parse") : undefined}
                    errorContent={{
                        title: error === "quota" ? t("quotaHit") : t("flashcard.error"),
                        onRetry: runGenerate,
                        retryLabel: t("flashcard.regenerate"),
                    }}
                >
                    {cards.length > 0 ? (
                        done ? (
                            <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border border-separator p-8 text-center">
                                <CheckCircleIcon aria-hidden focusable="false" className="size-8 text-success" />
                                <Typography type="h6" weight="bold">
                                    {t("flashcard.done")}
                                </Typography>
                                <div className="mt-2 flex gap-2">
                                    <Button
                                        variant={hasAuthored ? "primary" : "secondary"}
                                        size="sm"
                                        onPress={restart}
                                    >
                                        {t("flashcard.studyAgain")}
                                    </Button>
                                    {/* "Tạo lại" chỉ có nghĩa với bộ AI. Bộ do giảng viên soạn mà bấm
                                    tạo lại là đổi câu hỏi người dạy chọn lấy câu máy đoán — đúng
                                    thứ góp ý phàn nàn. */}
                                    {hasAuthored ? null : (
                                        <Button variant="primary" size="sm" onPress={runGenerate}>
                                            <ArrowClockwiseIcon aria-hidden focusable="false" className="size-4" />
                                            {t("flashcard.regenerate")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : card ? (
                            <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
                                <ProgressMeter
                                    value={currentIndex + 1}
                                    max={cards.length}
                                    label={t("flashcard.cardProgress", {
                                        current: currentIndex + 1,
                                        total: cards.length,
                                    })}
                                />

                                <button
                                    type="button"
                                    aria-label={t("flashcard.flip")}
                                    aria-pressed={revealed}
                                    onClick={() => setRevealed((prev) => !prev)}
                                    className="flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-separator bg-surface p-8 text-center outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-focus"
                                >
                                    <Typography
                                        type="body-xs"
                                        weight="medium"
                                        className={cn(revealed ? "text-success" : "text-accent")}
                                    >
                                        {revealed ? t("flashcard.answerLabel") : t("flashcard.questionLabel")}
                                    </Typography>
                                    <Typography type="h6" weight="semibold">
                                        {revealed ? card.a : card.q}
                                    </Typography>
                                    <span className="flex items-center gap-1 text-muted">
                                        <CursorClickIcon className="size-3.5" aria-hidden focusable="false" />
                                        <Typography type="body-xs" color="muted">
                                            {revealed ? t("flashcard.flipBackHint") : t("flashcard.flipHint")}
                                        </Typography>
                                    </span>
                                </button>

                                <div className="flex items-center justify-between gap-3">
                                    <Button size="sm" variant="secondary" isDisabled={isFirst} onPress={goPrev}>
                                        {t("flashcard.previous")}
                                    </Button>
                                    {revealed || isLast ? (
                                        <Button size="sm" variant="primary" onPress={goNext}>
                                            {t("flashcard.next")}
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" onPress={() => setRevealed(true)}>
                                            {t("flashcard.showAnswer")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : null
                    ) : null}
                </AsyncContent>
            )}
        </div>
    )
}

export default LessonAiFlashcards
