import React from "react"
import { BookOpenIcon, PuzzlePieceIcon, CardsIcon } from "@phosphor-icons/react"
import type { DailyQuestKey } from "../../hooks/useQueryDailyQuestSwr"

/** Phosphor icon per daily-quest task key. */
export const DAILY_QUEST_ICON_MAP: Record<DailyQuestKey, React.ReactNode> = {
    readContent: <BookOpenIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
    passChallenge: <PuzzlePieceIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
    reviewFlashcards: <CardsIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
}
