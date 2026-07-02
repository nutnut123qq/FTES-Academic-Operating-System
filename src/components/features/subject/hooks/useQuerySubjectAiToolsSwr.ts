"use client"

import useSWR from "swr"

/** AI tool key (§9 AI Platform surfaces inside a subject). */
export type AiToolKey = "tutor" | "summary" | "quiz" | "flashcards" | "ocr"

/** Availability of a tool. `available` opens a surface; `comingSoon` is a disabled shell. */
export type AiToolStatus = "available" | "comingSoon"

/** An AI tool shell (mock until BE lands). */
export interface AiTool {
    key: AiToolKey
    /** Whether the tool opens a working surface or renders a coming-soon shell. */
    status: AiToolStatus
}

// ponytail: mock BE — no AI endpoint yet. Fixed set of tool shells. Tutor/summary/
// quiz/flashcards are live surfaces; OCR stays a coming-soon shell this change.
const fetchAiToolsMock = async (): Promise<Array<AiTool>> => [
    { key: "tutor", status: "available" },
    { key: "summary", status: "available" },
    { key: "quiz", status: "available" },
    { key: "flashcards", status: "available" },
    { key: "ocr", status: "comingSoon" },
]

/** Loads a subject's AI tools. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectAiToolsSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-ai-tools", subjectId],
        () => fetchAiToolsMock(),
    )
    return { tools: data ?? [], isLoading, error, mutate }
}
