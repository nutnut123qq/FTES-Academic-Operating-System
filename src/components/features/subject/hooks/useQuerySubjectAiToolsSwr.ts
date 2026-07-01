"use client"

import useSWR from "swr"

/** AI tool key (§9 AI Platform surfaces inside a subject). */
export type AiToolKey = "tutor" | "summary" | "quiz" | "flashcards" | "ocr"

/** An AI tool shell (mock until BE lands). */
export interface AiTool {
    key: AiToolKey
}

// ponytail: mock BE — no AI endpoint yet. Fixed set of tool shells.
const fetchAiToolsMock = async (): Promise<Array<AiTool>> => [
    { key: "tutor" },
    { key: "summary" },
    { key: "quiz" },
    { key: "flashcards" },
    { key: "ocr" },
]

/** Loads a subject's AI tools. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectAiToolsSwr = (subjectId: string) => {
    const { data, isLoading, error } = useSWR(
        ["subject-ai-tools", subjectId],
        () => fetchAiToolsMock(),
    )
    return { tools: data ?? [], isLoading, error }
}
