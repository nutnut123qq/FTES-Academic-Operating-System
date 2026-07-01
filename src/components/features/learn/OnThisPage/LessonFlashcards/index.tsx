"use client"

import React from "react"
import useSWR from "swr"
import { Button, Typography } from "@heroui/react"
import { CardsThreeIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { queryFlashcardDecksByCourse } from "@/modules/api/graphql/queries/query-flashcard-decks-by-course"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledList } from "@/components/blocks/lists/LabeledList"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useAppSelector } from "@/redux/hooks"
import { pathConfig } from "@/resources/path"

/** Props for {@link LessonFlashcards}. */
export type LessonFlashcardsProps = WithClassNames<undefined>

/**
 * Right-rail "review this lesson" panel: the flashcard decks linked to the lesson
 * currently being read (via the `flashcard_deck_contents` M2M), with a primary CTA
 * into the Flashcards page to start a spaced-repetition session. Reads the active
 * course + content id from Redux and self-hides when the lesson has no linked decks
 * (AsyncContent empty → null), so it never leaves an empty box in the rail.
 * @param props - {@link LessonFlashcardsProps}
 */
export const LessonFlashcards = ({ className }: LessonFlashcardsProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    const contentId = useAppSelector((state) => state.content.id)

    // decks linked to THIS lesson; key null until both ids hydrate
    const { data, isLoading } = useSWR(
        courseId && contentId ? ["lesson-flashcard-decks", courseId, contentId] : null,
        async () => {
            const response = await queryFlashcardDecksByCourse({
                request: { courseId: courseId as string, contentId: contentId as string },
            })
            return response.data?.flashcardDecksByCourse.data ?? null
        },
    )

    const decks = data ?? []

    // open the Flashcards page for this course (deck is chosen there)
    const onReview = () => {
        if (!courseDisplayId) {
            return
        }
        router.push(
            pathConfig().locale(locale).course(courseDisplayId).learn().flashcards().build(),
        )
    }

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={
                <div className="flex flex-col gap-3">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.Typography type="body-xs" width="3/4" />
                    <Skeleton.Button />
                </div>
            }
            isEmpty={decks.length === 0}
        >
            <LabeledList
                className={className}
                icon={<CardsThreeIcon className="size-5" aria-hidden focusable="false" />}
                label={t("lessonRail.flashcards.title")}
                action={(
                    <Button size="sm" variant="primary" className="self-start" onPress={onReview}>
                        {t("lessonRail.flashcards.review")}
                    </Button>
                )}
            >
                {decks.map((deck) => (
                    <Typography key={deck.id} type="body-sm" color="muted" truncate>
                        {deck.title}
                    </Typography>
                ))}
            </LabeledList>
        </AsyncContent>
    )
}
