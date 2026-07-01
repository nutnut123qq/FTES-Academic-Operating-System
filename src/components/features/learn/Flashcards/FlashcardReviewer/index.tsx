"use client"

import React, { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, CursorClickIcon, LockIcon } from "@phosphor-icons/react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { SM2_GRADES } from "../constants"
import { FlashcardReviewerSkeleton } from "./FlashcardReviewerSkeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { mutateReviewFlashcard } from "@/modules/api/graphql/mutations/mutation-review-flashcard"
import { queryFlashcardDeck } from "@/modules/api/graphql/queries/query-flashcard-deck"
import { type FlashcardCardEntity } from "@/modules/types/entities/flashcard-card"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { FlipCard } from "@/components/blocks/cards/FlipCard"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { RatingBar } from "@/components/blocks/buttons/RatingBar"
import { useAppSelector } from "@/redux/hooks"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { pathConfig } from "@/resources/path"

/** Props for {@link FlashcardReviewer}. */
export interface FlashcardReviewerProps extends WithClassNames<undefined> {
    /** Deck id being reviewed. */
    deckId: string
}

/** HeroUI Chip color per interview seniority level. */
const LEVEL_COLOR: Record<string, "success" | "warning" | "danger" | "accent"> = {
    junior: "success",
    middle: "warning",
    senior: "danger",
    staff: "accent",
}

/**
 * Spaced-repetition reviewer over one deck. One card at a time: the Markdown
 * question on the front, flipped to reveal the model answer plus optional depth,
 * then graded for recall (Again / Hard / Good / Easy) — each grade reschedules the
 * card via `reviewFlashcard` (SM-2) and advances. Previous steps back to re-grade;
 * a summary closes the run. Data states go through {@link AsyncContent}.
 * @param props - {@link FlashcardReviewerProps}
 */
export const FlashcardReviewer = ({ deckId, className }: FlashcardReviewerProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const runGraphQL = useGraphQLWithToast()
    // owning course slug drives the deep-links to referenced lessons/modules
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    // entitlement: enrolled viewers unlock premium cards (first ~20%/deck stay free)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    // index of the card currently shown
    const [currentIndex, setCurrentIndex] = useState(0)
    // whether the current card is flipped to its answer side
    const [revealed, setRevealed] = useState(false)
    // true while a grade is in flight (blocks the rating bar)
    const [reviewing, setReviewing] = useState(false)
    // how many cards were graded this run (shown in the summary)
    const [reviewedCount, setReviewedCount] = useState(0)

    // load the full deck graph (cards with question + answer)
    const { data, isLoading, error, mutate } = useSWR(
        ["flashcard-deck", deckId],
        async () => {
            const response = await queryFlashcardDeck({
                request: { flashcardDeckId: deckId },
            })
            return response.data?.flashcardDeck.data ?? null
        },
    )

    // cards in display order
    const cards = useMemo<Array<FlashcardCardEntity>>(
        () => [...(data?.cards ?? [])].sort((prev, next) => prev.sortIndex - next.sortIndex),
        [data?.cards],
    )

    // SM-2 grade buttons, localized for the rating bar
    const ratingOptions = useMemo(
        () => SM2_GRADES.map((grade) => ({ grade: grade.grade, label: t(grade.labelKey) })),
        [t],
    )

    const card = cards[currentIndex]
    // a premium card is locked for a non-enrolled viewer — its answer is withheld
    const isLocked = Boolean(card?.isPremium) && !enrolled
    const isFirst = currentIndex === 0

    /** Open the course page so the viewer can enrol to unlock premium cards. */
    const onUnlock = useCallback(() => {
        router.push(pathConfig().locale(locale).course(courseDisplayId).build())
    }, [router, locale, courseDisplayId])
    // past the last card → the run is complete
    const done = cards.length > 0 && currentIndex >= cards.length

    // step back to re-grade an earlier card (always on its question side)
    const goPrev = () => {
        setRevealed(false)
        setCurrentIndex((index) => Math.max(index - 1, 0))
    }

    // grade the current card, reschedule it (SM-2), then advance
    const onRate = useCallback(
        async (grade: number) => {
            if (!card) {
                return
            }
            setReviewing(true)
            // a success toast per card would be noise — only surface failures
            const ok = await runGraphQL(
                async () => {
                    const response = await mutateReviewFlashcard({
                        request: { cardId: card.id, grade },
                    })
                    return (
                        response.data?.reviewFlashcard ?? {
                            success: false,
                            message: t("flashcard.review.error"),
                        }
                    )
                },
                { showSuccessToast: false },
            )
            setReviewing(false)
            if (ok) {
                setReviewedCount((count) => count + 1)
                setRevealed(false)
                setCurrentIndex((index) => index + 1)
            }
        },
        [card, runGraphQL, t],
    )

    // restart the deck from the first card
    const onRestart = () => {
        setCurrentIndex(0)
        setRevealed(false)
        setReviewedCount(0)
    }

    return (
        <AsyncContent
            isLoading={(isLoading || !data) && cards.length === 0}
            skeleton={<FlashcardReviewerSkeleton />}
            isEmpty={cards.length === 0}
            emptyContent={{ title: t("flashcard.empty") }}
            error={cards.length === 0 ? error : undefined}
            errorContent={{
                title: t("flashcard.empty"),
                onRetry: () => { void mutate() },
            }}
        >
            {done ? (
                <EmptyState
                    icon={<CheckCircleIcon aria-hidden focusable="false" />}
                    title={t("flashcard.review.sessionDoneTitle")}
                    description={t("flashcard.review.sessionDoneDescription", { count: reviewedCount })}
                    action={
                        <Button size="sm" variant="primary" onPress={onRestart}>
                            {t("flashcard.review.studyAgain")}
                        </Button>
                    }
                />
            ) : (
                <div className={cn("flex flex-col gap-6", className)}>
                    {/* progress by position through the deck */}
                    <ProgressMeter
                        value={currentIndex + 1}
                        max={cards.length}
                        label={t("flashcard.cardProgress", {
                            current: currentIndex + 1,
                            total: cards.length,
                        })}
                    />

                    {/* current card meta: interview level + technology tags */}
                    {card && (card.level || (card.tags?.length ?? 0) > 0) ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {card.level ? (
                                <Chip size="sm" variant="soft" color={LEVEL_COLOR[card.level] ?? "default"}>
                                    {t(`flashcard.level.${card.level}`)}
                                </Chip>
                            ) : null}
                            {card.tags?.map((tag) => (
                                <Chip key={tag} size="sm" variant="soft" color="default">
                                    {tag}
                                </Chip>
                            ))}
                        </div>
                    ) : null}

                    {/* the flip card: question → answer (+ optional depth) */}
                    <FlipCard
                        revealed={revealed}
                        onToggle={() => setRevealed((flipped) => !flipped)}
                        ariaLabel={revealed ? t("flashcard.showQuestion") : t("flashcard.showAnswer")}
                        frontHint={
                            <>
                                <CursorClickIcon className="size-3.5" aria-hidden focusable="false" />
                                {t("flashcard.flipHint")}
                            </>
                        }
                        backHint={isLocked ? undefined : (
                            <>
                                <CursorClickIcon className="size-3.5" aria-hidden focusable="false" />
                                {t("flashcard.flipBackHint")}
                            </>
                        )}
                        front={
                            <>
                                <Typography type="body-xs" weight="medium" color="muted">
                                    {t("flashcard.questionLabel")}
                                </Typography>
                                <MarkdownContent markdown={card?.question ?? ""} />
                            </>
                        }
                        back={
                            <>
                                <Typography type="body-xs" weight="medium" color="muted">
                                    {t("flashcard.answerLabel")}
                                </Typography>
                                {isLocked ? (
                                    // premium card, viewer not enrolled → withhold the answer
                                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                                        <LockIcon aria-hidden focusable="false" className="size-8 text-muted" />
                                        <Typography type="body-sm" weight="semibold">
                                            {t("flashcard.premiumLockedTitle")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {t("flashcard.premiumLockedHint")}
                                        </Typography>
                                    </div>
                                ) : (
                                    <>
                                        {card?.answer ? (
                                            <MarkdownContent markdown={card.answer} />
                                        ) : (
                                            <Typography type="body-sm" color="muted">
                                                {t("flashcard.noAnswer")}
                                            </Typography>
                                        )}
                                        {card?.explanation ? (
                                            <MarkdownContent markdown={card.explanation} />
                                        ) : null}
                                    </>
                                )}
                            </>
                        }
                    />

                    {/* reveal first, then grade recall (which advances) — unless the card is
                        locked premium, where we surface an enrol CTA instead of grading */}
                    {revealed && isLocked ? (
                        <div className="flex justify-center">
                            <Button size="sm" variant="primary" onPress={onUnlock}>
                                {t("flashcard.premiumCta")}
                            </Button>
                        </div>
                    ) : revealed ? (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-xs" color="muted" align="center">
                                {t("flashcard.review.rateHint")}
                            </Typography>
                            <RatingBar
                                options={ratingOptions}
                                onRate={(grade) => void onRate(grade)}
                                isPending={reviewing}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                size="sm"
                                variant="secondary"
                                isDisabled={isFirst}
                                onPress={goPrev}
                            >
                                {t("flashcard.previous")}
                            </Button>
                            <Button size="sm" variant="outline" onPress={() => setRevealed(true)}>
                                {t("flashcard.showAnswer")}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </AsyncContent>
    )
}
