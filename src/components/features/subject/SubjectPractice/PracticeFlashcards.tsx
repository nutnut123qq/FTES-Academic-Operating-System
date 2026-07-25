"use client"

import React from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    CursorClickIcon,
    GearIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
    applyFlashcardReview,
    useQuerySubjectPracticeFlashcardsSwr,
} from "../hooks/useQuerySubjectPracticeFlashcardsSwr"
import { useMutateSubjectFlashcardReviewSwr } from "../hooks/useMutateSubjectFlashcardReviewSwr"
import { PracticeFlashcardManager } from "./PracticeFlashcardManager"
import { PRACTICE_SM2_GRADES, previewIntervalDays } from "./flashcardSm2"
import { resolvePracticeErrorKey } from "./practiceQuizLogic"

/** Props for {@link PracticeFlashcards}. */
export interface PracticeFlashcardsProps {
    subjectId: string
    /** Return to the practice hub. */
    onBack: () => void
    /**
     * Opens the subject's AI tools tab — offered when the subject has no curated deck
     * yet, so the learner can still generate cards from its resources.
     */
    onOpenAiTools: () => void
}

/**
 * Practice flashcards — the SM-2 reviewer over the subject's CURATED decks
 * (`GET /api/v1/subjects/{code}/practice/flashcards`).
 *
 * Reviewer mechanics are unchanged (one card at a time, flip front↔back, a
 * "Thẻ i/total" meter, the four-grade self-rating row, a session summary), but the
 * scheduling is now the server's: every grade posts to
 * `POST …/flashcards/{cardId}/review` and the returned SM-2 state (ease · interval ·
 * dueAt · the deck's remaining due count) is written back into the SWR cache — so the
 * progress SURVIVES A RELOAD instead of living in component state. The queue is
 * ordered due-first and each card shows whether it is due.
 *
 * Curators (`canManage`) additionally get the deck/card management panel.
 */
export const PracticeFlashcards = ({
    subjectId,
    onBack,
    onOpenAiTools,
}: PracticeFlashcardsProps) => {
    const t = useTranslations("subjects")
    const { guard } = useRequireAuth()
    const { code, cards, decks, dueCount, canManage, isLoading, error, mutate } =
        useQuerySubjectPracticeFlashcardsSwr(subjectId)
    const review = useMutateSubjectFlashcardReviewSwr()

    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [revealed, setRevealed] = React.useState(false)
    const [reviewedCount, setReviewedCount] = React.useState(0)
    const [managing, setManaging] = React.useState(false)
    const [reviewErrorKey, setReviewErrorKey] = React.useState<string | null>(null)
    /**
     * Card ids in the order this session walks them, frozen when the deck payload
     * arrives. The hook's queue re-sorts due-first on every review, so walking `cards`
     * by index would jump over the neighbour of the card just graded.
     */
    const [queueIds, setQueueIds] = React.useState<Array<string>>([])

    const byId = React.useMemo(() => new Map(cards.map((entry) => [entry.id, entry])), [cards])

    React.useEffect(() => {
        setQueueIds((previous) =>
            previous.length === 0 && cards.length > 0 ? cards.map((entry) => entry.id) : previous,
        )
    }, [cards])

    // Skip ids that vanished (a curator deleted the card mid-session).
    let cursor = currentIndex
    while (cursor < queueIds.length && !byId.has(queueIds[cursor])) {
        cursor += 1
    }
    const card = cursor < queueIds.length ? byId.get(queueIds[cursor]) ?? null : null
    const done = queueIds.length > 0 && cursor >= queueIds.length
    const isFirst = cursor === 0

    const goPrev = () => {
        setRevealed(false)
        setCurrentIndex(Math.max(cursor - 1, 0))
    }

    /**
     * Grades the current card. The SERVER runs SM-2 and persists it; its response
     * patches the cached deck (progress + due counters) before the queue advances. A
     * failed call keeps the learner on the card so the grade is not silently lost.
     */
    const rate = async (grade: number) => {
        if (!card || review.isMutating) return
        setReviewErrorKey(null)
        try {
            const outcome = await review.trigger({ code, cardId: card.id, grade })
            if (!outcome) return
            await mutate((current) => applyFlashcardReview(current, outcome), {
                revalidate: false,
            })
            setReviewedCount((count) => count + 1)
            setRevealed(false)
            setCurrentIndex(cursor + 1)
        } catch (cause) {
            setReviewErrorKey(resolvePracticeErrorKey(cause))
        }
    }

    const restart = () => {
        setCurrentIndex(0)
        setRevealed(false)
        setReviewedCount(0)
        setReviewErrorKey(null)
        // Drop the frozen order and re-read the decks: the next session re-queues
        // around whatever is still due after this run.
        setQueueIds([])
        void mutate()
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size="sm"
                    variant="tertiary"
                    isIconOnly
                    aria-label={t("practice.backToHub")}
                    onPress={onBack}
                >
                    <ArrowLeftIcon className="size-5" aria-hidden focusable="false" />
                </Button>
                <Typography type="h5" weight="bold" className="flex-1">
                    {t("practice.flashcards.title")}
                </Typography>
                {dueCount > 0 ? (
                    <Chip size="sm" variant="soft" color="accent">
                        {t("practice.flashcards.dueSummary", { count: dueCount })}
                    </Chip>
                ) : null}
                {canManage ? (
                    <Button size="sm" variant="secondary" onPress={() => setManaging((open) => !open)}>
                        <GearIcon aria-hidden focusable="false" className="size-4" />
                        {t(managing ? "practice.flashcards.manageClose" : "practice.flashcards.manage")}
                    </Button>
                ) : null}
            </div>

            {managing && canManage ? (
                <PracticeFlashcardManager
                    code={code}
                    decks={decks}
                    onChanged={() => {
                        setCurrentIndex(0)
                        setRevealed(false)
                        setQueueIds([])
                        void mutate()
                    }}
                />
            ) : null}

            <AsyncContent
                isLoading={isLoading && cards.length === 0}
                skeleton={<Skeleton className="mx-auto h-64 w-full max-w-xl rounded-large" />}
                isEmpty={cards.length === 0}
                emptyContent={{
                    title: t("practice.flashcards.empty"),
                    description: t("practice.flashcardsHandoff.description"),
                    action: (
                        <Button size="sm" variant="primary" onPress={onOpenAiTools}>
                            <SparkleIcon aria-hidden focusable="false" className="size-4" />
                            {t("practice.flashcardsHandoff.cta")}
                        </Button>
                    ),
                }}
                error={error}
                errorContent={{
                    title: t(`practice.errors.${resolvePracticeErrorKey(error)}`),
                    onRetry: () => {
                        void mutate()
                    },
                }}
            >
                {done ? (
                    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl border border-separator p-8 text-center">
                        <CheckCircleIcon aria-hidden focusable="false" className="size-8 text-success" />
                        <Typography type="h6" weight="bold">
                            {t("practice.flashcards.sessionDoneTitle")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("practice.flashcards.sessionDoneDesc", { count: reviewedCount })}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {dueCount > 0
                                ? t("practice.flashcards.sessionDoneDue", { count: dueCount })
                                : t("practice.flashcards.progressSaved")}
                        </Typography>
                        <Button variant="secondary" className="mt-2" onPress={restart}>
                            {t("practice.flashcards.studyAgain")}
                        </Button>
                    </div>
                ) : card ? (
                    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
                        <ProgressMeter
                            value={cursor + 1}
                            max={queueIds.length}
                            label={t("practice.flashcards.cardProgress", {
                                current: cursor + 1,
                                total: queueIds.length,
                            })}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="default">
                                {card.tag}
                            </Chip>
                            {card.progress?.due ? (
                                <Chip size="sm" variant="soft" color="accent">
                                    {t("practice.flashcards.dueBadge")}
                                </Chip>
                            ) : null}
                            <Chip size="sm" variant="soft">
                                {t(
                                    `practice.flashcards.status.${(card.progress?.status ?? "NEW").toLowerCase()}`,
                                )}
                            </Chip>
                        </div>

                        <button
                            type="button"
                            aria-label={t("practice.flashcards.flip")}
                            aria-pressed={revealed}
                            onClick={() => setRevealed((prev) => !prev)}
                            className="flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-separator bg-surface p-8 text-center outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-focus"
                        >
                            <Typography
                                type="body-xs"
                                weight="medium"
                                className={cn(revealed ? "text-success" : "text-accent")}
                            >
                                {revealed
                                    ? t("practice.flashcards.answerLabel")
                                    : t("practice.flashcards.questionLabel")}
                            </Typography>
                            <Typography type="h5" weight="semibold">
                                {revealed ? card.definition : card.term}
                            </Typography>
                            <span className="flex items-center gap-1 text-muted">
                                <CursorClickIcon className="size-3.5" aria-hidden focusable="false" />
                                <Typography type="body-xs" color="muted">
                                    {revealed
                                        ? t("practice.flashcards.flipBackHint")
                                        : t("practice.flashcards.flipHint")}
                                </Typography>
                            </span>
                        </button>

                        {reviewErrorKey ? (
                            <Typography type="body-sm" align="center" className="text-danger">
                                {t(`practice.errors.${reviewErrorKey}`)}
                            </Typography>
                        ) : null}

                        {revealed ? (
                            <div className="flex flex-col gap-2">
                                <Typography type="body-xs" color="muted" align="center">
                                    {t("practice.flashcards.rateHint")}
                                </Typography>
                                <div className="grid grid-cols-4 gap-2">
                                    {PRACTICE_SM2_GRADES.map((option) => {
                                        const days = previewIntervalDays(card.progress, option.grade)
                                        return (
                                            <button
                                                key={option.grade}
                                                type="button"
                                                disabled={review.isMutating}
                                                onClick={guard(() => void rate(option.grade))}
                                                className={cn(
                                                    "flex flex-col items-center gap-0.5 rounded-xl border py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60",
                                                    option.tone,
                                                )}
                                            >
                                                <Typography type="body-sm" weight="medium">
                                                    {t(`practice.flashcards.rating.${option.labelKey}`)}
                                                </Typography>
                                                <Typography type="body-xs" color="muted">
                                                    {t("practice.flashcards.intervalDays", { count: days })}
                                                </Typography>
                                            </button>
                                        )
                                    })}
                                </div>
                                <Typography type="body-xs" color="muted" align="center">
                                    {t("practice.flashcards.progressSaved")}
                                </Typography>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    isDisabled={isFirst}
                                    onPress={goPrev}
                                >
                                    {t("practice.flashcards.previous")}
                                </Button>
                                <Button size="sm" variant="outline" onPress={() => setRevealed(true)}>
                                    {t("practice.flashcards.showAnswer")}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
