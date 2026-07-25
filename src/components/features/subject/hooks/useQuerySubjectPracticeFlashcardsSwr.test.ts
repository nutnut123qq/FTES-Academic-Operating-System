import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — subject practice flashcards.
 *
 * The reviewer used to compute SM-2 in component state (progress died on reload) over a
 * hook that resolved a hard-coded `[]`. It now reads the curated decks from
 * `GET /subjects/{code}/practice/flashcards` and grades through
 * `POST …/flashcards/{cardId}/review`. Pinned here: the queue is built due-first from
 * the server payload, the review call carries the grade, and the response's SM-2 state
 * (ease / interval / dueAt / due counters) is what lands back in the cache.
 */

vi.mock("@/modules/api/rest/subject/subject", () => ({
    getSubjectFlashcards: vi.fn(),
    reviewFlashcard: vi.fn(),
    createFlashcardDeck: vi.fn(),
    addFlashcardCards: vi.fn(),
    deleteFlashcardDeck: vi.fn(),
}))

import { reviewFlashcard } from "@/modules/api/rest/subject/subject"
import type {
    FlashcardDecksView,
    FlashcardProgressView,
    ReviewFlashcardResultView,
} from "@/modules/api/rest/subject/types"
import {
    applyFlashcardReview,
    flattenPracticeFlashcards,
} from "./useQuerySubjectPracticeFlashcardsSwr"
import { reviewPracticeCard } from "./useMutateSubjectFlashcardReviewSwr"

const progress = (over: Partial<FlashcardProgressView> = {}): FlashcardProgressView => ({
    status: "NEW",
    ease: "2.50",
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: null,
    lastReviewedAt: null,
    lastGrade: null,
    due: true,
    ...over,
})

const decksView: FlashcardDecksView = {
    subjectCode: "CS101",
    deckCount: 2,
    totalCards: 3,
    dueCount: 2,
    canManage: false,
    decks: [
        {
            id: "deck-1",
            subjectCode: "CS101",
            title: "Cấu trúc dữ liệu",
            description: null,
            visibility: "PUBLIC",
            status: "PUBLISHED",
            cardCount: 2,
            dueCount: 1,
            newCount: 1,
            createdAt: null,
            updatedAt: null,
            cards: [
                {
                    id: "card-1",
                    front: "Stack",
                    back: "LIFO",
                    sortOrder: 0,
                    // already scheduled far out → NOT due
                    progress: progress({
                        status: "REVIEWING",
                        intervalDays: 6,
                        repetitions: 2,
                        dueAt: "2026-09-01T00:00:00Z",
                        due: false,
                    }),
                },
                { id: "card-2", front: "Queue", back: "FIFO", sortOrder: 1, progress: progress() },
            ],
        },
        {
            id: "deck-2",
            subjectCode: "CS101",
            title: "Thuật toán",
            description: null,
            visibility: "PUBLIC",
            status: "PUBLISHED",
            cardCount: 1,
            dueCount: 1,
            newCount: 1,
            createdAt: null,
            updatedAt: null,
            cards: [
                { id: "card-3", front: "BFS", back: "Duyệt theo tầng", sortOrder: 0, progress: progress() },
            ],
        },
    ],
}

describe("flattenPracticeFlashcards", () => {
    it("flattens every deck and puts the DUE cards first", () => {
        const cards = flattenPracticeFlashcards(decksView)

        expect(cards.map((card) => card.id)).toEqual(["card-2", "card-3", "card-1"])
        // deck title becomes the topic chip; the owning deck id rides along
        expect(cards[0]).toMatchObject({
            term: "Queue",
            definition: "FIFO",
            tag: "Cấu trúc dữ liệu",
            deckId: "deck-1",
        })
        expect(cards[1].tag).toBe("Thuật toán")
    })

    it("returns an empty queue for a subject with no decks", () => {
        expect(flattenPracticeFlashcards(undefined)).toEqual([])
        expect(flattenPracticeFlashcards({ ...decksView, decks: [] })).toEqual([])
    })
})

describe("reviewPracticeCard", () => {
    beforeEach(() => {
        vi.mocked(reviewFlashcard).mockReset()
    })

    it("posts the grade to the reviewed card and returns the SERVER state", async () => {
        const serverOutcome: ReviewFlashcardResultView = {
            cardId: "card-2",
            deckId: "deck-1",
            progress: progress({
                status: "REVIEWING",
                ease: "2.60",
                intervalDays: 1,
                repetitions: 1,
                dueAt: "2026-07-26T10:00:00Z",
                lastGrade: 4,
                due: false,
            }),
            deckDueCount: 0,
        }
        vi.mocked(reviewFlashcard).mockResolvedValue(serverOutcome)

        const outcome = await reviewPracticeCard({ code: "CS101", cardId: "card-2", grade: 4 })

        expect(reviewFlashcard).toHaveBeenCalledWith("CS101", "card-2", { grade: 4 })
        expect(outcome.progress.dueAt).toBe("2026-07-26T10:00:00Z")
        expect(outcome.progress.intervalDays).toBe(1)
    })
})

describe("applyFlashcardReview", () => {
    const outcome: ReviewFlashcardResultView = {
        cardId: "card-2",
        deckId: "deck-1",
        progress: progress({
            status: "REVIEWING",
            ease: "2.60",
            intervalDays: 6,
            repetitions: 2,
            dueAt: "2026-08-01T00:00:00Z",
            lastGrade: 5,
            due: false,
        }),
        deckDueCount: 0,
    }

    it("writes the server's due state onto the reviewed card", () => {
        const next = applyFlashcardReview(decksView, outcome)
        const reviewed = next?.decks[0].cards.find((card) => card.id === "card-2")

        expect(reviewed?.progress.dueAt).toBe("2026-08-01T00:00:00Z")
        expect(reviewed?.progress.due).toBe(false)
        expect(reviewed?.progress.intervalDays).toBe(6)
        // the card is no longer at the head of the queue once it stopped being due
        expect(flattenPracticeFlashcards(next).map((card) => card.id)).toEqual([
            "card-3",
            "card-1",
            "card-2",
        ])
    })

    it("takes the deck due count from the response and re-totals the subject", () => {
        const next = applyFlashcardReview(decksView, outcome)

        expect(next?.decks[0].dueCount).toBe(0)
        // deck-2 still owes one card
        expect(next?.decks[1].dueCount).toBe(1)
        expect(next?.dueCount).toBe(1)
    })

    it("leaves other decks and an empty cache untouched", () => {
        const next = applyFlashcardReview(decksView, outcome)

        expect(next?.decks[1]).toBe(decksView.decks[1])
        expect(applyFlashcardReview(undefined, outcome)).toBeUndefined()
    })
})
