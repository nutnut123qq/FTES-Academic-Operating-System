"use client"

import React, { useCallback, useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Button, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, CursorClickIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { DUE_REVIEW_LIMIT, SM2_GRADES } from "../constants"
import { DueReviewSkeleton } from "./DueReviewSkeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { mutateReviewFlashcard } from "@/modules/api/graphql/mutations/mutation-review-flashcard"
import { queryMyDueFlashcards } from "@/modules/api/graphql/queries/query-my-due-flashcards"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { FlipCard } from "@/components/blocks/cards/FlipCard"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { RatingBar } from "@/components/blocks/buttons/RatingBar"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link DueReview}. */
export interface DueReviewProps extends WithClassNames<undefined> {
    /** Leave the session and return to the flashcards home. */
    onExit: () => void
}

/**
 * The spaced-repetition (SM-2) review session over the viewer's due cards, drawn
 * across every enrolled course. One card at a time: flip to reveal the answer,
 * then grade recall (Again / Hard / Good / Easy) — each grade reschedules the card
 * via `reviewFlashcard` and advances. A session summary closes the run. The due
 * count is the page's primary loop, so this is the main entry from the home hero.
 * @param props - {@link DueReviewProps}
 */
export const DueReview = ({ onExit, className }: DueReviewProps) => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const { mutate: globalMutate } = useSWRConfig()
    // scope the due queue to THIS course; shared SWR key with the hero (DueReviewHero)
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const dueKey = useMemo(
        () => ["my-due-flashcards", courseId ?? null, DUE_REVIEW_LIMIT] as const,
        [courseId],
    )
    // index of the card currently shown + whether its answer is revealed
    const [currentIndex, setCurrentIndex] = useState(0)
    const [revealed, setRevealed] = useState(false)
    // true while a grade is in flight (blocks the rating bar)
    const [reviewing, setReviewing] = useState(false)
    // how many cards were graded this session (shown in the summary)
    const [reviewedCount, setReviewedCount] = useState(0)

    // the due queue (count + first batch of cards), shared key with the hero
    const { data, isLoading, error, mutate } = useSWR(dueKey, async () => {
        const response = await queryMyDueFlashcards({ request: { courseId, limit: DUE_REVIEW_LIMIT } })
        return response.data?.myDueFlashcards.data ?? null
    })

    const cards = data?.cards ?? []
    const card = cards[currentIndex]
    // past the last card → the session is complete
    const done = cards.length > 0 && currentIndex >= cards.length

    // SM-2 grade buttons for the current card: localized label + next-interval
    // preview ("4 days") computed server-side from the card's current state
    const ratingOptions = useMemo(() => {
        const intervals = card?.nextIntervals
        // map a grade to its previewed next-interval in days
        const daysForGrade = (grade: number): number | undefined => {
            if (!intervals) {
                return undefined
            }
            return [intervals.again, intervals.hard, intervals.good, intervals.easy][grade]
        }
        return SM2_GRADES.map((grade) => {
            const days = daysForGrade(grade.grade)
            return {
                grade: grade.grade,
                label: t(grade.labelKey),
                hint: days === undefined ? undefined : t("flashcard.review.intervalDays", { count: days }),
            }
        })
    }, [t, card])

    // grade the current card, reschedule it (SM-2), then advance to the next
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
                        request: { cardId: card.cardId, grade },
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

    // finish: refresh the due queue (count changed) and return home
    const onFinish = useCallback(() => {
        void globalMutate(dueKey)
        onExit()
    }, [globalMutate, onExit, dueKey])

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={<DueReviewSkeleton />}
            isEmpty={cards.length === 0}
            emptyContent={{
                title: t("flashcard.due.allCaught"),
                description: t("flashcard.due.allCaughtHint"),
            }}
            error={error}
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
                        <Button size="sm" variant="primary" onPress={onFinish}>
                            {t("flashcard.review.backToHome")}
                        </Button>
                    }
                />
            ) : (
                <div className={cn("flex flex-col gap-3", className)}>
                    {/* progress through this batch */}
                    <ProgressMeter
                        value={currentIndex + 1}
                        max={cards.length}
                        label={t("flashcard.cardProgress", {
                            current: currentIndex + 1,
                            total: cards.length,
                        })}
                    />

                    {/* which deck this card belongs to (cards span all courses) */}
                    {card ? (
                        <Typography type="body-xs" color="muted">
                            {card.deckTitle}
                        </Typography>
                    ) : null}

                    {/* the flip card: prompt → answer */}
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
                        backHint={
                            <>
                                <CursorClickIcon className="size-3.5" aria-hidden focusable="false" />
                                {t("flashcard.flipBackHint")}
                            </>
                        }
                        front={
                            <>
                                <Typography type="body-xs" weight="medium" color="muted">
                                    {t("flashcard.questionLabel")}
                                </Typography>
                                <MarkdownContent markdown={card?.front ?? ""} />
                            </>
                        }
                        back={
                            <>
                                <Typography type="body-xs" weight="medium" color="muted">
                                    {t("flashcard.answerLabel")}
                                </Typography>
                                <MarkdownContent markdown={card?.back ?? ""} />
                            </>
                        }
                    />

                    {/* reveal first, then grade recall (which advances) */}
                    {revealed ? (
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
                        <Button size="sm" variant="outline" onPress={() => setRevealed(true)}>
                            {t("flashcard.showAnswer")}
                        </Button>
                    )}
                </div>
            )}
        </AsyncContent>
    )
}
