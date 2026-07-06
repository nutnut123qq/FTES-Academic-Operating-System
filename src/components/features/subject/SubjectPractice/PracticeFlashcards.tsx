"use client"

import React from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { ArrowLeftIcon, CheckCircleIcon, CursorClickIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { SM2_GRADES, nextIntervalDays } from "../SubjectAiTools/SubjectAiFlashcards/constants"
import { useQuerySubjectPracticeFlashcardsSwr } from "../hooks/useQuerySubjectPracticeFlashcardsSwr"

/** Props for {@link PracticeFlashcards}. */
export interface PracticeFlashcardsProps {
    subjectId: string
    /** Return to the practice hub. */
    onBack: () => void
}

/**
 * Practice flashcards — a compact reuse of the Task-A StarCI `FlashcardReviewer`
 * (STT 9). Same reviewer mechanics: one card at a time, flip front↔back, a
 * "Thẻ i/total" progress meter, and — once revealed — the SM-2 self-rating row
 * (Quên / Khó / Được / Dễ) with real per-grade interval previews that advance the
 * run; a summary closes it (studyAgain). Backed by a fixed practice deck
 * (`useQuerySubjectPracticeFlashcardsSwr`) rather than the AI source-pick flow.
 */
export const PracticeFlashcards = ({ subjectId, onBack }: PracticeFlashcardsProps) => {
    const t = useTranslations("subjects")
    const { cards, isLoading, error, mutate } = useQuerySubjectPracticeFlashcardsSwr(subjectId)

    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [revealed, setRevealed] = React.useState(false)
    const [reviewedCount, setReviewedCount] = React.useState(0)
    const [streaks, setStreaks] = React.useState<Record<string, number>>({})

    const card = cards[currentIndex] ?? null
    const done = cards.length > 0 && currentIndex >= cards.length
    const isFirst = currentIndex === 0

    const goPrev = () => {
        setRevealed(false)
        setCurrentIndex((index) => Math.max(index - 1, 0))
    }

    /** Grade the current card (SM-2), grow/reset its recall streak, then advance. */
    const onRate = (grade: number) => {
        if (!card) return
        setStreaks((prev) => {
            const current = prev[card.id] ?? 0
            const next = grade === 0 ? 0 : grade >= 2 ? current + 1 : current
            return { ...prev, [card.id]: next }
        })
        setReviewedCount((count) => count + 1)
        setRevealed(false)
        setCurrentIndex((index) => index + 1)
    }

    const restart = () => {
        setCurrentIndex(0)
        setRevealed(false)
        setReviewedCount(0)
        setStreaks({})
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-2">
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
            </div>

            <AsyncContent
                isLoading={isLoading && cards.length === 0}
                skeleton={<Skeleton className="mx-auto h-64 w-full max-w-xl rounded-large" />}
                isEmpty={cards.length === 0}
                emptyContent={{ title: t("practice.flashcards.empty") }}
                error={error}
                errorContent={{
                    title: t("practice.flashcards.error"),
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
                        <Button variant="secondary" className="mt-2" onPress={restart}>
                            {t("practice.flashcards.studyAgain")}
                        </Button>
                    </div>
                ) : card ? (
                    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
                        <ProgressMeter
                            value={currentIndex + 1}
                            max={cards.length}
                            label={t("practice.flashcards.cardProgress", {
                                current: currentIndex + 1,
                                total: cards.length,
                            })}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="default">
                                {card.tag}
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

                        {revealed ? (
                            <div className="flex flex-col gap-2">
                                <Typography type="body-xs" color="muted" align="center">
                                    {t("practice.flashcards.rateHint")}
                                </Typography>
                                <div className="grid grid-cols-4 gap-2">
                                    {SM2_GRADES.map((option) => {
                                        const streak = streaks[card.id] ?? 0
                                        const days = nextIntervalDays(option.grade, streak)
                                        const interval =
                                            days === 0
                                                ? t("practice.flashcards.intervalNow")
                                                : t("practice.flashcards.intervalDays", { count: days })
                                        return (
                                            <button
                                                key={option.grade}
                                                type="button"
                                                onClick={() => onRate(option.grade)}
                                                className={cn(
                                                    "flex flex-col items-center gap-0.5 rounded-xl border py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                                                    option.tone,
                                                )}
                                            >
                                                <Typography type="body-sm" weight="medium">
                                                    {t(`practice.flashcards.rating.${option.labelKey}`)}
                                                </Typography>
                                                <Typography type="body-xs" color="muted">
                                                    {interval}
                                                </Typography>
                                            </button>
                                        )
                                    })}
                                </div>
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
