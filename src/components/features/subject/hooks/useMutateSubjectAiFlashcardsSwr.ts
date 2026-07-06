"use client"

import useSWRMutation from "swr/mutation"

/** A single generated flashcard (front term / back definition). */
export interface SubjectAiFlashcard {
    id: string
    /** Front of the card (the prompt/term to recall). */
    term: string
    /** Back of the card (the answer/definition). */
    definition: string
    /** Optional topic tags shown as chips above the card (mirrors StarCI card meta). */
    tags?: Array<string>
}

/** The generated deck plus the source it was built from (drives the deck framing). */
export interface SubjectAiFlashcardDeck {
    /** Human title of the deck (the source it was generated from). */
    title: string
    /** The cards, in study order. */
    cards: Array<SubjectAiFlashcard>
}

/** Args for a flashcards generation. */
export interface GenerateFlashcardsArgs {
    subjectCode: string
    sourceTitle: string
    /** Force the mock failure path (retry testing). */
    fail?: boolean
}

/** ~1s so the generation loading state is observable. */
const MOCK_DELAY_MS = 950

/** Fixed mock deck length. */
const DECK_SIZE = 8

/** Deterministic tag pool so cards carry StarCI-style topic chips. */
const TAG_POOL = ["Cơ bản", "Định nghĩa", "Ứng dụng", "Nâng cao", "Ví dụ"]

// ponytail: mock BE — no flashcards endpoint. Builds a source-aware deck.
const generateFlashcardsMock = async (
    _key: string,
    { arg }: { arg: GenerateFlashcardsArgs },
): Promise<SubjectAiFlashcardDeck> => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
    if (arg.fail) {
        throw new Error("mock-flashcards-failure")
    }
    const cards = Array.from({ length: DECK_SIZE }, (_, i) => ({
        id: `f${i + 1}`,
        term: `Khái niệm ${i + 1} — ${arg.subjectCode}`,
        definition:
            `Định nghĩa demo cho khái niệm ${i + 1} trong "${arg.sourceTitle}". ` +
            "(AI demo — nội dung mô phỏng phía client.)",
        tags: [TAG_POOL[i % TAG_POOL.length]],
    }))
    return { title: arg.sourceTitle, cards }
}

/**
 * Generates a mock flashcard deck from a picked subject source. SWR-mutation-
 * shaped for a drop-in BE swap. BE assumption (logged): a real BE generates the
 * deck for the (subject, source).
 *
 * @param subjectId - the `[subjectId]` route segment (scopes the SWR key).
 */
export const useMutateSubjectAiFlashcardsSwr = (subjectId: string) => {
    return useSWRMutation<
        SubjectAiFlashcardDeck,
        Error,
        string,
        GenerateFlashcardsArgs
    >(`subject-ai-flashcards:${subjectId}`, generateFlashcardsMock)
}
