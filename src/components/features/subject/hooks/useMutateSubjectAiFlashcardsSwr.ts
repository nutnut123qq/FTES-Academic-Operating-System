"use client"

import { useState } from "react"
import { submitFlashcardsJob } from "@/modules/api/rest/ai"
import type { FlashcardsResult } from "@/components/features/ai-platform/tools/types"

import { useSubjectAiJob } from "./useSubjectAiJob"

/** A single generated flashcard (front term / back definition). */
export interface SubjectAiFlashcard {
    /** Stable per-run id (index-derived — the worker sends no ids). */
    id: string
    /** Front of the card (the prompt/term to recall). */
    term: string
    /** Back of the card (the answer/definition). */
    definition: string
    /** Optional hint shown under the question side. */
    hint?: string
    /** Topic chips (from the worker's `skill` facet, when present). */
    tags?: Array<string>
}

/** The generated deck plus the source it was built from. */
export interface SubjectAiFlashcardDeck {
    /** Human title of the deck (the source it was generated from). */
    title: string
    /** The cards, in study order. */
    cards: Array<SubjectAiFlashcard>
    /** Producing model. */
    model?: string
}

/** Args for a flashcards run. */
export interface GenerateSubjectFlashcardsArgs {
    /** Resource UUID picked in the source list (BE `resourceId`). */
    resourceId: string
    /** Deck title to frame the run with (the picked source's title). */
    title: string
    /** How many cards to ask for (BE `cardCount`). */
    cardCount: number
    /** UI locale forwarded as the generation language. */
    language: string
}

/**
 * A worker flashcard. The BE contract is a SUPERSET of the AI-hub `Flashcard`
 * (`{front, back, hint, skill}`), so `skill` is picked up here rather than widening
 * the shared hub type.
 */
type WorkerFlashcard = {
    front?: string
    back?: string
    hint?: string
    skill?: string
}

/**
 * Maps a raw `FLASHCARDS` job result into a study deck.
 *
 * Cards missing both sides are dropped — an empty front/back is unstudiable and
 * would render a blank card instead of failing honestly.
 *
 * @param raw - the parsed job result, or undefined before the job COMPLETED.
 * @param title - deck title (the picked source), used as the session framing.
 * @returns the deck, or undefined when the run produced no usable card.
 */
export const mapFlashcardsJobResult = (
    raw: FlashcardsResult | string | undefined,
    title: string,
): SubjectAiFlashcardDeck | undefined => {
    if (!raw || typeof raw === "string") return undefined
    const source = (raw.cards ?? []) as Array<WorkerFlashcard>
    const cards = source
        .filter((card) => !!card?.front?.trim() && !!card?.back?.trim())
        .map((card, index) => ({
            id: `f${index + 1}`,
            term: (card.front ?? "").trim(),
            definition: (card.back ?? "").trim(),
            hint: card.hint?.trim() || undefined,
            tags: card.skill ? [card.skill] : undefined,
        }))
    if (!cards.length) return undefined
    return { title, cards, model: raw.model }
}

/** Default deck size asked of the worker. */
export const SUBJECT_FLASHCARDS_DEFAULT_COUNT = 10

/**
 * Runs the REAL flashcards job for a picked subject resource:
 * `POST /ai/learning/flashcards` with `{resourceId, cardCount, language}` → poll
 * `GET /ai/jobs/{id}` → hand back a study deck.
 *
 * Scheduling (SM-2 grades / intervals) stays CLIENT-SIDE: the BE has no flashcard
 * review endpoint, so a rating is lost on reload (see the deferred note).
 */
export const useMutateSubjectAiFlashcardsSwr = () => {
    const job = useSubjectAiJob<FlashcardsResult | string>()
    // Deck framing: the worker echoes no source title, so the picked source's title
    // is captured at submit time and carried onto the finished deck.
    const [title, setTitle] = useState("")

    /** Submit a flashcards job for the picked resource. */
    const generate = (args: GenerateSubjectFlashcardsArgs) => {
        setTitle(args.title)
        void job.run(() =>
            submitFlashcardsJob({
                resourceId: args.resourceId,
                cardCount: args.cardCount,
                language: args.language,
            }),
        )
    }

    /** Drop the deck and its framing (back to the source picker). */
    const reset = () => {
        setTitle("")
        job.reset()
    }

    return {
        ...job,
        generate,
        reset,
        deck: mapFlashcardsJobResult(job.result, title),
    }
}
