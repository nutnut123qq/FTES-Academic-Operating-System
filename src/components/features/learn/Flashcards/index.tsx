"use client"

import React from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { EnrollGate } from "../shared/EnrollGate"
import { LearnBreadcrumb } from "../shared/LearnBreadcrumb"
import { FlashcardReviewer } from "./FlashcardReviewer"
import { InterviewSession } from "./InterviewSession"
import { DueReview } from "./DueReview"
import { DueReviewHero } from "./DueReviewHero"
import { FlashcardStatsStrip } from "./FlashcardStatsStrip"
import { FlashcardMobileNav } from "./FlashcardMobileNav"
import { useFlashcardNav } from "./useFlashcardNav"
import { type WithClassNames } from "@/modules/types/base/class-name"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { useAppSelector } from "@/redux/hooks"
import { useQueryCourseEnrollmentStatusSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseEnrollmentStatusSwr"
import { queryFlashcardDeck } from "@/modules/api/graphql/queries/query-flashcard-deck"

/** Props for {@link Flashcards}. */
export type FlashcardsProps = WithClassNames<undefined>

/**
 * Course-level flashcards WORK PANE. The mode switch + deck list live in the
 * left rail (rendered by the learn layout, same as the content-map rail); this
 * page is the right pane and reads the active surface off the URL via
 * {@link useFlashcardNav}: study mode lands on an overview (today's due queue +
 * mastery), opens a deck's SM-2 reviewer, or runs the cross-deck due session;
 * interview mode drills the chosen deck by voice.
 *
 * Back navigation from a sub-view (a deck / the due session) is the breadcrumb's
 * clickable "Ôn tập" crumb — no separate back-link.
 * @param {FlashcardsProps} props Optional wrapper placement props.
 */
export const Flashcards = ({ className }: FlashcardsProps) => {
    const t = useTranslations()
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const { mode, deckId, session, goDue, goOverview } = useFlashcardNav()
    // mock interview is enrolled-only (it spends AI credits) — gate the tab for trial viewers
    const enrollmentSwr = useQueryCourseEnrollmentStatusSwr()
    const isEnrolled = enrollmentSwr.data?.courseEnrollmentStatus?.data?.isEnrolled === true

    // deck name for the breadcrumb when reviewing one deck (shared SWR key with the
    // reviewer → one fetch). The reviewer owns the heavy card states.
    const { data: deckData } = useSWR(
        deckId ? ["flashcard-deck", deckId] : null,
        async () => {
            const response = await queryFlashcardDeck({
                request: { flashcardDeckId: deckId as string },
            })
            return response.data?.flashcardDeck.data ?? null
        },
    )

    // breadcrumb: a sub-view (deck / due session) inserts a clickable "Ôn tập" crumb
    // (→ overview) + names the sub-view; the overview/interview just end at "Ôn tập".
    const isDeck = mode === "study" && Boolean(deckId)
    const isDue = mode === "study" && session === "due"
    const breadcrumb = isDeck ? (
        <LearnBreadcrumb
            current={deckData?.title ?? t("flashcard.title")}
            section={{ label: t("flashcard.title"), onPress: goOverview }}
        />
    ) : isDue ? (
        <LearnBreadcrumb
            current={t("flashcard.due.label")}
            section={{ label: t("flashcard.title"), onPress: goOverview }}
        />
    ) : (
        <LearnBreadcrumb current={t("flashcard.title")} />
    )

    return (
        <div className={className}>
            <div className="mx-auto flex max-w-3xl flex-col gap-10">
                <PageHeader
                    breadcrumb={breadcrumb}
                    title={t("flashcard.title")}
                    description={t("flashcard.subtitle")}
                />

                {/* mobile fallback for the hidden left rail: mode switch + deck picker */}
                <FlashcardMobileNav />

                {mode === "study" ? (
                    session === "due" ? (
                        <DueReview onExit={goOverview} />
                    ) : deckId ? (
                        // keyed so switching decks resets the reviewer's local state
                        <FlashcardReviewer key={deckId} deckId={deckId} />
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* today's spaced-repetition queue + mastery overview */}
                            <DueReviewHero onStart={goDue} />
                            <FlashcardStatsStrip />
                        </div>
                    )
                ) : !isEnrolled ? (
                    // trial viewer → lock the interview behind an enroll CTA
                    <EnrollGate
                        title={t("flashcard.interview.gateTitle")}
                        description={t("flashcard.interview.gateDescription")}
                    />
                ) : courseId ? (
                    // mock interview = a fixed-length random session over the whole
                    // course (no per-deck topic pick); keyed by course so it resets
                    <InterviewSession key={courseId} courseId={courseId} />
                ) : null}
            </div>
        </div>
    )
}
