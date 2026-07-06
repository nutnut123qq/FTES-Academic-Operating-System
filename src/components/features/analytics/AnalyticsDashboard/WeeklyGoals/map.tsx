import React from "react"
import {
    BookOpenIcon,
    FireIcon,
    PuzzlePieceIcon,
    CodeIcon,
    CardsIcon,
} from "@phosphor-icons/react"
import type { KpiKey } from "../../hooks/useQueryWeeklyGoalsSwr"

/** Phosphor icon per weekly-KPI key. */
export const KPI_ICON_MAP: Record<KpiKey, React.ReactNode> = {
    lessons: <BookOpenIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
    studyDays: <FireIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
    challenges: <PuzzlePieceIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
    coding: <CodeIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
    flashcards: <CardsIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
}

/** Weekly-KPI display order (label key === KPI key). */
export const KPI_ORDER: Array<KpiKey> = [
    "lessons",
    "studyDays",
    "challenges",
    "coding",
    "flashcards",
]

/**
 * Sensible default weekly targets used when the learner hasn't set a custom goal
 * yet — so each meter tracks this week's activity out of the box (the bar fills as
 * you study). The learner can still override any of these via the editor.
 */
export const DEFAULT_KPI_TARGETS: Record<KpiKey, number> = {
    lessons: 5,
    studyDays: 5,
    challenges: 3,
    coding: 3,
    flashcards: 20,
}
