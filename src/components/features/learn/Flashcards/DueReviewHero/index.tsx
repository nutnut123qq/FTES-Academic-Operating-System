"use client"

import React from "react"
import useSWR from "swr"
import { Button, Typography } from "@heroui/react"
import { CardsThreeIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { DUE_REVIEW_LIMIT } from "../constants"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { queryMyDueFlashcards } from "@/modules/api/graphql/queries/query-my-due-flashcards"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link DueReviewHero}. */
export interface DueReviewHeroProps extends WithClassNames<undefined> {
    /** Start the spaced-repetition review of the due cards. */
    onStart: () => void
}

/**
 * The flashcards home hero: the spaced-repetition queue. Shows how many cards are
 * due today across every enrolled course and offers the page's PRIMARY action —
 * starting a review session. When nothing is due it collapses to a caught-up
 * empty state. Reads the shared `myDueFlashcards` key directly from SWR.
 * @param props - {@link DueReviewHeroProps}
 */
export const DueReviewHero = ({ onStart, className }: DueReviewHeroProps) => {
    const t = useTranslations()
    // scope the due queue to THIS course (the count must reflect this course's
    // decks, not every deck system-wide); shared SWR key with {@link DueReview}.
    const courseId = useAppSelector((state) => state.course.entity?.id)

    const { data, isLoading, error, mutate } = useSWR(
        ["my-due-flashcards", courseId ?? null, DUE_REVIEW_LIMIT],
        async () => {
            const response = await queryMyDueFlashcards({ request: { courseId, limit: DUE_REVIEW_LIMIT } })
            return response.data?.myDueFlashcards.data ?? null
        },
    )

    const dueCount = data?.dueCount ?? 0

    return (
        <LabeledCard
            className={className}
            label={t("flashcard.due.label")}
            icon={<CardsThreeIcon className="size-5" aria-hidden focusable="false" />}
        >
            <AsyncContent
                isLoading={isLoading && !data}
                skeleton={
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton.Typography type="body-sm" width="1/2" />
                        <Skeleton.Button />
                    </div>
                }
                isEmpty={dueCount === 0}
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Typography type="body-sm" color="muted">
                        {t("flashcard.due.count", { count: dueCount })}
                    </Typography>
                    <Button variant="primary" onPress={onStart}>
                        {t("flashcard.due.start", { count: dueCount })}
                    </Button>
                </div>
            </AsyncContent>
        </LabeledCard>
    )
}
