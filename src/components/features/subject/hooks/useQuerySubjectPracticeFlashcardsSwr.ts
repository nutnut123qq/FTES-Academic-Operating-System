"use client"

import useSWR from "swr"

/** A single practice flashcard (front term / back definition + topic tag). */
export interface PracticeFlashcard {
    id: string
    term: string
    definition: string
    tag: string
}

/** ~600ms so the loading skeleton is observable. */
const MOCK_DELAY_MS = 600

// ponytail: mock BE — no practice-flashcards endpoint yet. A fixed sample deck.
const DECK_MOCK: ReadonlyArray<PracticeFlashcard> = [
    {
        id: "p1",
        term: "Big-O của tìm kiếm nhị phân?",
        definition: "O(log n) — mỗi bước loại bỏ một nửa không gian tìm kiếm.",
        tag: "Thuật toán",
    },
    {
        id: "p2",
        term: "HTTP 200 nghĩa là gì?",
        definition: "OK — yêu cầu đã được xử lý thành công.",
        tag: "Web",
    },
    {
        id: "p3",
        term: "Khác biệt giữa stack và queue?",
        definition: "Stack là LIFO (vào sau ra trước); queue là FIFO (vào trước ra trước).",
        tag: "Cấu trúc dữ liệu",
    },
    {
        id: "p4",
        term: "ACID trong CSDL là viết tắt của?",
        definition: "Atomicity, Consistency, Isolation, Durability.",
        tag: "Cơ sở dữ liệu",
    },
    {
        id: "p5",
        term: "Từ khoá tạo hằng số trong JavaScript?",
        definition: "const — không thể gán lại (nhưng object bên trong vẫn có thể đổi).",
        tag: "JavaScript",
    },
    {
        id: "p6",
        term: "REST viết tắt của?",
        definition: "Representational State Transfer.",
        tag: "Web",
    },
]

/**
 * Loads a subject's practice flashcard deck. Mocked; SWR-shaped for a drop-in BE
 * swap. BE assumption (logged): a real BE returns the subject's curated practice
 * deck (independent of the AI-generated decks).
 *
 * @param subjectId - the `[subjectId]` route segment (scopes the SWR key).
 */
export const useQuerySubjectPracticeFlashcardsSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-practice-flashcards", subjectId],
        async (): Promise<Array<PracticeFlashcard>> => {
            await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
            return [...DECK_MOCK]
        },
    )
    return { cards: data ?? [], isLoading, error, mutate }
}
