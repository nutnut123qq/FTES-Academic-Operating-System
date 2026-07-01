"use client"

import React from "react"
import useSWR from "swr"
import { Chip, Typography } from "@heroui/react"
import { ChartLineUpIcon, FlameIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { DUE_REVIEW_LIMIT } from "../constants"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { queryFlashcardDecksByCourse } from "@/modules/api/graphql/queries/query-flashcard-decks-by-course"
import { queryMyDueFlashcards } from "@/modules/api/graphql/queries/query-my-due-flashcards"
import { queryMyFlashcardStats } from "@/modules/api/graphql/queries/query-my-flashcard-stats"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link FlashcardStatsStrip}. */
export type FlashcardStatsStripProps = WithClassNames<undefined>

/** Below this many lifetime reviews, the retention % is noise (e.g. 100% off one
 * review), so the caption is hidden. */
const RETENTION_MIN_REVIEWS = 5

/**
 * The flashcards home progress block — mastery-first. Leads with how much of the
 * course's deck set the viewer has MASTERED (the quantity that actually grows):
 * a maturity bar (mastered · learning · new) over the total card count, with the
 * review streak as a momentum chip and retention as a quiet caption. Reuses the
 * sibling SWR keys (deck list + due hero + stats) so it adds no extra fetch.
 * @param props - {@link FlashcardStatsStripProps}
 */
export const FlashcardStatsStrip = ({ className }: FlashcardStatsStripProps) => {
    const t = useTranslations()
    // scope mastery + new-backlog to THIS course (shared keys with the siblings)
    const courseId = useAppSelector((state) => state.course.entity?.id)

    // streak / retention / lifetime reviews
    const stats = useSWR(["my-flashcard-stats"], async () => {
        const response = await queryMyFlashcardStats({})
        return response.data?.myFlashcardStats.data ?? null
    })
    // decks → mastered + total cards (same key as FlashcardDeckList → cache shared)
    const decks = useSWR(
        courseId ? ["flashcard-decks-by-course", courseId] : null,
        async () => {
            const response = await queryFlashcardDecksByCourse({
                request: { courseId: courseId as string },
            })
            return response.data?.flashcardDecksByCourse.data ?? null
        },
    )
    // new (never-reviewed) backlog (same key as DueReviewHero → cache shared)
    const due = useSWR(
        ["my-due-flashcards", courseId ?? null, DUE_REVIEW_LIMIT],
        async () => {
            const response = await queryMyDueFlashcards({
                request: { courseId, limit: DUE_REVIEW_LIMIT },
            })
            return response.data?.myDueFlashcards.data ?? null
        },
    )

    // mastery split across the course's decks (all derived from existing data)
    const deckList = decks.data ?? []
    const total = deckList.reduce((sum, deck) => sum + (deck.cards?.length ?? 0), 0)
    const mastered = deckList.reduce((sum, deck) => sum + (deck.masteredCount ?? 0), 0)
    const newCount = Math.min(due.data?.newTotalCount ?? 0, total)
    const learning = Math.max(0, total - mastered - newCount)

    const streak = stats.data?.currentStreak ?? 0
    const retention = stats.data?.retentionRate ?? 0
    const totalReviewed = stats.data?.totalReviewed ?? 0
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0

    // still hydrating when no facet has resolved yet
    const isLoading =
        (stats.isLoading || decks.isLoading || due.isLoading) &&
        !stats.data && !decks.data && !due.data

    return (
        <AsyncContent
            isLoading={isLoading}
            skeleton={
                <div className="flex flex-col gap-3">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.SegmentBar />
                    <Skeleton.Typography type="body-xs" width="3/4" />
                </div>
            }
            // nothing to show only when the course has no cards at all
            isEmpty={total === 0}
            error={decks.error}
            errorContent={{
                title: t("flashcard.empty"),
                onRetry: () => { void decks.mutate() },
            }}
        >
            <LabeledCard
                className={className}
                label={t("flashcard.stats.label")}
                icon={<ChartLineUpIcon className="size-5" aria-hidden focusable="false" />}
            >
                <div className="flex flex-col gap-3">
                    {/* headline: mastered / total (+%) balanced by the streak chip */}
                    <div className="flex items-center justify-between gap-3">
                        <Typography type="body-sm" className="min-w-0 truncate">
                            {t("flashcard.stats.masteredLine", { mastered, total })}
                            <span className="text-muted">{" · "}{percent}%</span>
                        </Typography>
                        {streak > 0 ? (
                            <Chip
                                size="sm"
                                variant="secondary"
                                color="warning"
                                className="shrink-0 bg-warning/10 text-warning"
                            >
                                <FlameIcon className="size-3.5" aria-hidden focusable="false" />
                                {t("flashcard.stats.streakChip", { count: streak })}
                            </Chip>
                        ) : null}
                    </div>

                    {/* maturity bar: mastered · learning · new, filling toward total */}
                    <SegmentBar
                        max={total}
                        ariaLabel={t("flashcard.stats.barAria", {
                            mastered,
                            learning,
                            newCount,
                            total,
                        })}
                        segments={[
                            {
                                key: "mastered",
                                label: t("flashcard.stats.mastered"),
                                value: mastered,
                                color: "var(--success)",
                            },
                            {
                                key: "learning",
                                label: t("flashcard.stats.learning"),
                                value: learning,
                                color: "var(--warning)",
                            },
                            {
                                key: "new",
                                label: t("flashcard.stats.new"),
                                value: newCount,
                                // light track tone (same as a ProgressBar's empty
                                // track) — "untouched", NOT a heavy grey slice
                                color: "var(--default)",
                            },
                        ]}
                    />

                    {/* retention only once it's meaningful; else a first-review nudge */}
                    {totalReviewed >= RETENTION_MIN_REVIEWS ? (
                        <Typography type="body-xs" color="muted">
                            {t("flashcard.stats.retentionCaption", { percent: retention })}
                        </Typography>
                    ) : mastered === 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("flashcard.stats.firstReviewHint")}
                        </Typography>
                    ) : null}
                </div>
            </LabeledCard>
        </AsyncContent>
    )
}
