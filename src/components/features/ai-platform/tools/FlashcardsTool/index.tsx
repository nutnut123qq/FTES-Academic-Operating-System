"use client"

import React, { useState } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { submitFlashcardsJob } from "@/modules/api/rest/ai"
import { useAiToolJob } from "../../hooks/useAiToolJob"
import { AiToolShell, AiToolModelNote } from "../AiToolShell"
import { AiJobFeedback } from "../AiToolResult"
import {
    LearningInput,
    emptyLearningInput,
    learningInputBody,
    isLearningInputReady,
    type LearningInputValue,
} from "../LearningInput"
import type { Flashcard, FlashcardsResult } from "../types"

/** Selectable card counts. */
const CARD_COUNTS = [5, 10, 15, 20] as const

/**
 * `/ai/tools/flashcards` — generate a deck of flippable flashcards from a passage
 * or a studied lesson. Each card flips in place between its prompt and answer.
 */
export const FlashcardsTool = () => {
    const t = useTranslations("aiPlatform.toolPages")
    const locale = useLocale()
    const [input, setInput] = useState<LearningInputValue>(emptyLearningInput)
    const [cardCount, setCardCount] = useState<number>(10)
    const job = useAiToolJob<FlashcardsResult>()

    const submit = () =>
        void job.run(() =>
            submitFlashcardsJob({ ...learningInputBody(input), cardCount, language: locale }),
        )

    const cards = job.poll.result?.cards ?? []
    const ready = isLearningInputReady(input) && !job.isBusy

    return (
        <AiToolShell toolKey="flashcards">
            <LearningInput value={input} onChange={setInput} isDisabled={job.isBusy} />

            <div className="flex flex-col gap-2">
                <Typography type="body-sm" weight="medium">
                    {t("flashcards.count")}
                </Typography>
                <div className="flex gap-2">
                    {CARD_COUNTS.map((count) => (
                        <Button
                            key={count}
                            size="sm"
                            variant={cardCount === count ? "primary" : "secondary"}
                            onPress={() => setCardCount(count)}
                            isDisabled={job.isBusy}
                        >
                            {count}
                        </Button>
                    ))}
                </div>
            </div>

            <Button variant="primary" onPress={submit} isDisabled={!ready} isPending={job.isBusy}>
                {job.isBusy ? t("running") : t("run")}
            </Button>

            <AiJobFeedback job={job} onRetry={submit} />

            {cards.length ? (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <Typography type="body-sm" color="muted">
                            {t("flashcards.cardsCount", { count: cards.length })}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("flashcards.flipHint")}
                        </Typography>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {cards.map((card, index) => (
                            <FlashcardCard key={index} card={card} />
                        ))}
                    </div>
                    <AiToolModelNote model={job.poll.result?.model} />
                </div>
            ) : null}
        </AiToolShell>
    )
}

/** One flippable card — click/Enter toggles between {@link Flashcard.front} and back. */
const FlashcardCard = ({ card }: { card: Flashcard }) => {
    const t = useTranslations("aiPlatform.toolPages.flashcards")
    const [flipped, setFlipped] = useState(false)

    return (
        <button
            type="button"
            onClick={() => setFlipped((prev) => !prev)}
            aria-pressed={flipped}
            className={cn(
                "flex min-h-32 flex-col justify-center gap-2 rounded-2xl border p-4 text-left transition-colors",
                flipped
                    ? "border-accent/50 bg-accent/5"
                    : "border-separator hover:border-default hover:bg-default/40",
            )}
        >
            <Typography type="body-xs" color="muted" className="uppercase tracking-wide">
                {flipped ? t("backLabel") : t("frontLabel")}
            </Typography>
            <Typography type="body-sm">{flipped ? card.back : card.front}</Typography>
            {!flipped && card.hint ? (
                <Typography type="body-xs" color="muted">
                    {t("hint", { hint: card.hint })}
                </Typography>
            ) : null}
        </button>
    )
}
